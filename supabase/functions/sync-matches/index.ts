import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import {
  getConfig,
  fetchTeams,
  fetchSeasons,
  fetchSchedule,
  fetchLiveScores,
  mapStatus,
  mapPhase,
  resolveGroupCode,
  lookupTeamGroup,
  parseKickoff,
  parseScore,
  countryToEmoji,
} from "./_shared/sportsdb.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function startLog(supabase: ReturnType<typeof getSupabaseAdmin>, source: string, mode: string) {
  const { data } = await supabase
    .from("tip_sync_log")
    .insert({ source, mode, status: "success", matches_updated: 0 })
    .select("id")
    .single()
  return data?.id
}

async function finishLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  logId: string | undefined,
  status: string,
  matchesUpdated: number,
  errorMessage?: string
) {
  if (!logId) return
  await supabase
    .from("tip_sync_log")
    .update({
      finished_at: new Date().toISOString(),
      status,
      matches_updated: matchesUpdated,
      error_message: errorMessage || null,
    })
    .eq("id", logId)
}

async function syncTeams(supabase: ReturnType<typeof getSupabaseAdmin>, apiKey: string, leagueId: string) {
  const teams = await fetchTeams(apiKey, leagueId)
  if (!teams.length) {
    throw new Error(`TheSportsDB lieferte 0 Teams für Liga ${leagueId}. API-Pfad oder Liga-ID prüfen.`)
  }

  let updated = 0
  let lastError: string | null = null
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i]
    const externalId = String(t.idTeam || t.id)
    const groupCode = resolveGroupCode(t.strGroup, t.strLeague, t.strTeam || t.strTeamShort)
    const { error } = await supabase.from("tip_teams").upsert(
      {
        external_id: externalId,
        name: t.strTeam || t.strTeamShort,
        code: t.strTeamShort?.slice(0, 3)?.toUpperCase() || null,
        badge_url: t.strBadge || t.strTeamBadge || null,
        flag_url: t.strTeamLogo || null,
        flag_emoji: countryToEmoji(t.strCountry),
        group_code: groupCode,
        sort_order: i,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "external_id" }
    )
    if (error) lastError = error.message
    else updated++
  }

  if (updated === 0 && lastError) {
    throw new Error(`Teams konnten nicht gespeichert werden: ${lastError}`)
  }
  return updated
}

async function resolveSchedule(apiKey: string, leagueId: string, season: string) {
  const preferred = await fetchSchedule(apiKey, leagueId, season)
  if (preferred.length) return { events: preferred, seasonUsed: season }

  const seasons = await fetchSeasons(apiKey, leagueId)
  const seasonNames = seasons
    .map((s: Record<string, string>) => s.strSeason || s.season || s.name)
    .filter(Boolean)

  for (const candidate of seasonNames) {
    if (candidate === season) continue
    const events = await fetchSchedule(apiKey, leagueId, String(candidate))
    if (events.length) return { events, seasonUsed: String(candidate) }
  }

  const fallbacks = ["2026", "2025-2026", "2025"]
  for (const candidate of fallbacks) {
    if (candidate === season) continue
    const events = await fetchSchedule(apiKey, leagueId, candidate)
    if (events.length) return { events, seasonUsed: candidate }
  }

  return { events: [] as Record<string, string>[], seasonUsed: season }
}

async function syncSchedule(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  apiKey: string,
  leagueId: string,
  season: string
) {
  const { events, seasonUsed } = await resolveSchedule(apiKey, leagueId, season)
  if (!events.length) {
    throw new Error(`TheSportsDB lieferte 0 Spiele für Liga ${leagueId}, Saison ${season}. Verfügbare Saisons prüfen.`)
  }

  const { data: teamRows } = await supabase.from("tip_teams").select("id, external_id, group_code")
  const teamMap: Record<string, string> = {}
  const teamGroupMap: Record<string, string> = {}
  teamRows?.forEach((t) => {
    if (t.external_id) teamMap[t.external_id] = t.id
    if (t.id && t.group_code) teamGroupMap[t.id] = t.group_code
  })

  let updated = 0
  let lastError: string | null = null
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const externalId = String(e.idEvent || e.id)
    const { data: existing } = await supabase
      .from("tip_matches")
      .select("manual_override")
      .eq("external_id", externalId)
      .maybeSingle()

    if (existing?.manual_override) continue

    const homeTeamId = e.idHomeTeam ? teamMap[String(e.idHomeTeam)] : null
    const awayTeamId = e.idAwayTeam ? teamMap[String(e.idAwayTeam)] : null
    const status = mapStatus(e.strStatus || e.strProgress)
    const homeScore = parseScore(e.intHomeScore)
    const awayScore = parseScore(e.intAwayScore)

    const { error } = await supabase.from("tip_matches").upsert(
      {
        external_id: externalId,
        phase: mapPhase(e.strRound, e.strGroup),
        group_code:
          resolveGroupCode(e.strGroup, e.strRound, e.strHomeTeam)
          || (homeTeamId ? teamGroupMap[homeTeamId] : null)
          || lookupTeamGroup(e.strHomeTeam),
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        placeholder_home: e.strHomeTeam || null,
        placeholder_away: e.strAwayTeam || null,
        kickoff_at: parseKickoff(e.dateEvent, e.strTime || e.strTimeLocal),
        home_score: homeScore,
        away_score: awayScore,
        status,
        raw_status: e.strStatus || null,
        venue: e.strVenue || null,
        last_synced_at: new Date().toISOString(),
        sort_order: i,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "external_id" }
    )
    if (!error) updated++
    else lastError = error.message
  }

  if (updated === 0 && lastError) {
    throw new Error(`Spiele konnten nicht gespeichert werden: ${lastError}`)
  }

  if (seasonUsed !== season) {
    console.log(`Schedule: Saison ${season} leer, verwendet ${seasonUsed}`)
  }
  return updated
}

async function syncLive(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  apiKey: string,
  leagueId: string,
  force = false
) {
  if (!force) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from("tip_matches")
      .select("id", { count: "exact", head: true })
      .gte("kickoff_at", windowStart)
      .lte("kickoff_at", windowEnd)
    if (!count || count === 0) return { updated: 0, skipped: true }
  }

  const livescore = await fetchLiveScores(apiKey)
  const wmEvents = livescore.filter(
    (e: Record<string, string>) => String(e.idLeague || e.idLeagueSeason) === leagueId || String(e.strLeague || "").includes("World Cup")
  )

  let updated = 0
  for (const e of wmEvents) {
    const externalId = String(e.idEvent || e.id)
    const { data: existing } = await supabase
      .from("tip_matches")
      .select("manual_override")
      .eq("external_id", externalId)
      .maybeSingle()

    if (existing?.manual_override) continue

    const status = mapStatus(e.strStatus || e.strProgress)
    const homeScore = parseScore(e.intHomeScore)
    const awayScore = parseScore(e.intAwayScore)

    const { error } = await supabase
      .from("tip_matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status,
        raw_status: e.strStatus || null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("external_id", externalId)

    if (!error) updated++
  }
  return { updated, skipped: false }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  let logId: string | undefined
  const supabase = getSupabaseAdmin()

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {}
    const mode = body.mode || "live"
    const force = body.force === true
    const source = body.source || "cron"
    const { apiKey, leagueId, season } = getConfig()

    if (!apiKey) {
      throw new Error("SPORTSDB_API_KEY fehlt in Supabase Secrets")
    }

    logId = await startLog(supabase, source, mode)
    let totalUpdated = 0

    if (mode === "teams" || mode === "all") {
      totalUpdated += await syncTeams(supabase, apiKey, leagueId)
    }
    if (mode === "schedule" || mode === "all") {
      totalUpdated += await syncSchedule(supabase, apiKey, leagueId, season)
    }
    if (mode === "live" || mode === "all") {
      const liveResult = await syncLive(supabase, apiKey, leagueId, force || mode === "all")
      if (liveResult.skipped) {
        await finishLog(supabase, logId, "skipped", 0)
        return new Response(JSON.stringify({ ok: true, skipped: true, mode }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      totalUpdated += liveResult.updated
    }

    await finishLog(supabase, logId, "success", totalUpdated)
    return new Response(JSON.stringify({ ok: true, mode, matches_updated: totalUpdated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finishLog(supabase, logId, "error", 0, message)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
