import { createClient } from "@supabase/supabase-js"
import { getBerlinDayBounds, sortMatchesForToday } from "./dates"
import { buildKicktippRows, KICKTIPP_MATCH_WINDOW } from "./leaderboard-matrix"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const SUPABASE_CONFIG_ERROR =
  "Supabase ist nicht konfiguriert. In Vercel unter Settings → Environment Variables NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen und danach neu deployen."

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR)
  }
}

const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  lockType: "localstorage",
}

let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient) {
    assertSupabaseConfigured()
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions })
  }
  return supabaseClient
}

/** Lazy proxy – kein createClient beim Modul-Import (verhindert Build-Fehler beim Prerender). */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient()
      const value = client[prop]
      return typeof value === "function" ? value.bind(client) : value
    },
  }
)

// ─── AUTH ─────────────────────────────────────────────────────

export async function signUp(email, password, displayName) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, full_name: displayName },
    },
  })
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function requestPasswordReset(email, redirectTo) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}

export async function markPasswordChanged(userId) {
  return supabase
    .from("tip_profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", userId)
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("tip_profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  return profile
}

// ─── PROFILES ─────────────────────────────────────────────────

export async function getProfiles() {
  return supabase.from("tip_profiles").select("*").order("display_name")
}

export async function updateProfile(id, updates) {
  return supabase
    .from("tip_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
}

export async function activateProfile(userId) {
  return updateProfile(userId, { is_active: true })
}

export async function markOnboardingSeen(userId) {
  return updateProfile(userId, { onboarding_seen: true })
}

// ─── TEAMS ────────────────────────────────────────────────────

export async function getTeams() {
  return supabase.from("tip_teams").select("*").order("sort_order").order("name")
}

// ─── MATCHES ──────────────────────────────────────────────────

export async function getMatches(phase = null) {
  let query = supabase
    .from("tip_matches")
    .select(`
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji, group_code),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji, group_code)
    `)
    .order("kickoff_at")
    .order("sort_order")

  if (phase) query = query.eq("phase", phase)
  return query
}

export async function getUpcomingMatches(limit = null) {
  let query = supabase
    .from("tip_matches")
    .select(`
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji)
    `)
    .gte("kickoff_at", new Date().toISOString())
    .eq("status", "scheduled")
    .order("kickoff_at")

  if (limit != null) query = query.limit(limit)
  return query
}

export async function getTodayMatches() {
  const { start, end } = getBerlinDayBounds()
  const yesterdayBounds = getBerlinDayBounds(new Date(new Date(start).getTime() - 12 * 60 * 60 * 1000))

  const select = `
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji)
    `

  const [todayRes, liveYesterdayRes] = await Promise.all([
    supabase
      .from("tip_matches")
      .select(select)
      .gte("kickoff_at", start)
      .lte("kickoff_at", end)
      .order("kickoff_at"),
    supabase
      .from("tip_matches")
      .select(select)
      .eq("status", "live")
      .gte("kickoff_at", yesterdayBounds.start)
      .lt("kickoff_at", start)
      .order("kickoff_at"),
  ])

  const error = todayRes.error || liveYesterdayRes.error
  const byId = new Map()
  ;[...(todayRes.data || []), ...(liveYesterdayRes.data || [])].forEach((m) => byId.set(m.id, m))

  return {
    data: sortMatchesForToday([...byId.values()]),
    error,
  }
}

export async function updateMatch(id, updates) {
  return supabase
    .from("tip_matches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
}

// ─── PREDICTIONS ──────────────────────────────────────────────

export async function getMyPredictions(userId) {
  return supabase
    .from("tip_predictions")
    .select("*, match:tip_matches(*)")
    .eq("user_id", userId)
}

export async function getPredictionsForMatch(matchId) {
  return supabase
    .from("tip_predictions")
    .select("*")
    .eq("match_id", matchId)
}

export async function getMatchTipsWithProfiles(matchId) {
  const [profilesRes, predictionsRes] = await Promise.all([
    supabase
      .from("tip_profiles")
      .select("id, display_name")
      .eq("is_active", true)
      .eq("is_blocked", false)
      .order("display_name"),
    supabase
      .from("tip_predictions")
      .select("user_id, home_tip, away_tip, points")
      .eq("match_id", matchId),
  ])

  if (profilesRes.error) return { data: null, error: profilesRes.error }
  if (predictionsRes.error) return { data: null, error: predictionsRes.error }

  const predByUser = new Map()
  predictionsRes.data?.forEach((p) => predByUser.set(p.user_id, p))

  const data = (profilesRes.data || []).map((profile) => {
    const pred = predByUser.get(profile.id)
    return {
      userId: profile.id,
      displayName: profile.display_name,
      homeTip: pred?.home_tip ?? null,
      awayTip: pred?.away_tip ?? null,
      points: pred?.points ?? null,
    }
  })

  return { data, error: null }
}

export async function upsertPrediction({ matchId, userId, homeTip, awayTip }) {
  return supabase
    .from("tip_predictions")
    .upsert(
      {
        match_id: matchId,
        user_id: userId,
        home_tip: homeTip,
        away_tip: awayTip,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" }
    )
    .select()
    .single()
}

export async function deletePrediction({ matchId, userId }) {
  return supabase
    .from("tip_predictions")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", userId)
}

// ─── CHAMPION ─────────────────────────────────────────────────

export async function getChampionPrediction(userId) {
  return supabase
    .from("tip_champion_predictions")
    .select("*, team:tip_teams(*)")
    .eq("user_id", userId)
    .maybeSingle()
}

export async function upsertChampionPrediction(userId, teamId) {
  return supabase
    .from("tip_champion_predictions")
    .upsert(
      { user_id: userId, team_id: teamId, locked_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("*, team:tip_teams(*)")
    .single()
}

// ─── LEADERBOARD ──────────────────────────────────────────────

export async function getLeaderboard() {
  return supabase.from("tip_leaderboard").select("*")
}

export async function getMyRank(userId) {
  const { data } = await getLeaderboard()
  if (!data) return null
  const index = data.findIndex((row) => row.user_id === userId)
  return index >= 0 ? { rank: index + 1, ...data[index] } : null
}

const MATCH_SELECT_LEADERBOARD = `
  id,
  kickoff_at,
  home_score,
  away_score,
  status,
  placeholder_home,
  placeholder_away,
  home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code),
  away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code)
`

export async function getRecentFinishedMatches(limit = KICKTIPP_MATCH_WINDOW) {
  const { data, error } = await supabase
    .from("tip_matches")
    .select(MATCH_SELECT_LEADERBOARD)
    .eq("status", "finished")
    .order("kickoff_at", { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }
  return { data: [...(data || [])].reverse(), error: null }
}

export async function getPredictionsForMatches(matchIds) {
  if (!matchIds?.length) return { data: [], error: null }

  const { data: profilesRes, error: profilesError } = await supabase
    .from("tip_profiles")
    .select("id")
    .eq("is_active", true)
    .eq("is_blocked", false)

  if (profilesError) return { data: null, error: profilesError }

  const activeIds = (profilesRes || []).map((p) => p.id)
  if (!activeIds.length) return { data: [], error: null }

  return supabase
    .from("tip_predictions")
    .select("match_id, user_id, home_tip, away_tip, points")
    .in("match_id", matchIds)
    .in("user_id", activeIds)
}

export async function getLatestRankSnapshots() {
  const { data: latestRows, error: latestError } = await supabase
    .from("tip_rank_snapshots")
    .select("matchday_key")
    .order("matchday_key", { ascending: false })
    .limit(1)

  if (latestError) return { data: [], matchdayKey: null, error: latestError }
  const matchdayKey = latestRows?.[0]?.matchday_key
  if (!matchdayKey) return { data: [], matchdayKey: null, error: null }

  const { data, error } = await supabase
    .from("tip_rank_snapshots")
    .select("user_id, rank, total_points, matchday_key")
    .eq("matchday_key", matchdayKey)

  return { data: data || [], matchdayKey, error }
}

export async function getKicktippLeaderboardData() {
  const [leaderboardRes, matchesRes, snapshotsRes] = await Promise.all([
    getLeaderboard(),
    getRecentFinishedMatches(),
    getLatestRankSnapshots(),
  ])

  const error = leaderboardRes.error || matchesRes.error || snapshotsRes.error
  if (error) {
    return { data: null, error }
  }

  const matches = matchesRes.data || []
  const matchIds = matches.map((m) => m.id)
  const predictionsRes = await getPredictionsForMatches(matchIds)
  if (predictionsRes.error) {
    return { data: null, error: predictionsRes.error }
  }

  const rows = buildKicktippRows({
    leaderboard: leaderboardRes.data || [],
    matches,
    predictions: predictionsRes.data || [],
    snapshots: snapshotsRes.data || [],
  })

  return {
    data: {
      rows,
      matches,
      snapshotMatchday: snapshotsRes.matchdayKey,
    },
    error: null,
  }
}

// ─── SETTINGS ─────────────────────────────────────────────────

export async function getSettings() {
  const { data } = await supabase.from("tip_settings").select("*")
  const map = {}
  data?.forEach((row) => { map[row.key] = row.value })
  return map
}

export async function updateSetting(key, value) {
  return supabase
    .from("tip_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single()
}

export async function isTournamentStarted() {
  const settings = await getSettings()
  const start = settings.tournament_start
  if (!start) return false
  return new Date(start) <= new Date()
}

export async function getPredictionLockMinutes() {
  const settings = await getSettings()
  const parsed = parseInt(settings.prediction_lock_minutes || "30", 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30
}

// ─── SYNC LOG ─────────────────────────────────────────────────

export async function getSyncLogs(limit = 20) {
  return supabase
    .from("tip_sync_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)
}

// ─── ADMIN SYNC ───────────────────────────────────────────────

export async function triggerSync(mode = "all", force = true) {
  return supabase.functions.invoke("sync-matches", {
    body: { mode, force, source: "manual" },
  })
}
