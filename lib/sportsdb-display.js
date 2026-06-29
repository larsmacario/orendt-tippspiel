import { mapStatus, mapPhase, buildKnockoutPhaseMap, parseScore, extractGroupCode } from "./sportsdb-mapping"
import { TEAM_GROUP, getTeamFlagEmoji } from "./groups"
import { computeGroupStandings } from "./group-standings"

const V2_BASE = "https://www.thesportsdb.com/api/v2/json"
const V1_BASE = "https://www.thesportsdb.com/api/v1/json"

export function getDisplayConfig() {
  return {
    apiKey: process.env.SPORTSDB_API_KEY || "",
    leagueId: process.env.SPORTSDB_LEAGUE_ID || "4429",
    season: process.env.SPORTSDB_SEASON || "2026",
  }
}

async function sportsDbV2Fetch(path, apiKey) {
  const res = await fetch(`${V2_BASE}${path}`, {
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 45 },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TheSportsDB v2 ${res.status}: ${text}`)
  }
  return res.json()
}

async function sportsDbV1Fetch(path, apiKey) {
  const res = await fetch(`${V1_BASE}/${apiKey}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 45 },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TheSportsDB v1 ${res.status}: ${text}`)
  }
  return res.json()
}

export async function fetchLeagueLivescore(apiKey, leagueId) {
  const data = await sportsDbV2Fetch(`/livescore/${leagueId}`, apiKey)
  return data?.livescore || data?.events || []
}

export async function fetchNextEvents(apiKey, leagueId) {
  const data = await sportsDbV2Fetch(`/schedule/next/league/${leagueId}`, apiKey)
  return data?.schedule || data?.events || []
}

export async function fetchPreviousEvents(apiKey, leagueId) {
  const data = await sportsDbV2Fetch(`/schedule/previous/league/${leagueId}`, apiKey)
  return data?.schedule || data?.events || []
}

export async function fetchFullSchedule(apiKey, leagueId, season) {
  const data = await sportsDbV2Fetch(`/schedule/league/${leagueId}/${encodeURIComponent(season)}`, apiKey)
  return data?.schedule || data?.events || []
}

export function isEventSeason2026(raw) {
  if (String(raw?.strSeason || "") === "2026") return true
  return (raw?.dateEvent || "").startsWith("2026")
}

export async function fetchEventTimeline(apiKey, eventId) {
  const data = await sportsDbV2Fetch(`/lookup/event_timeline/${eventId}`, apiKey)
  return data?.timeline || data?.lookup || data?.event || []
}

export async function fetchLeagueTable(apiKey, leagueId, season) {
  const data = await sportsDbV1Fetch(`/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(season)}`, apiKey)
  return data?.table || []
}

function resolveGroupCode(strGroup, strRound, homeTeam, awayTeam) {
  const fromApi = extractGroupCode(strGroup, strRound)
  if (fromApi) return fromApi
  return TEAM_GROUP[homeTeam] || TEAM_GROUP[awayTeam] || null
}

function parseKickoff(dateEvent, strTime) {
  if (!dateEvent) return null
  const time = strTime && strTime !== "00:00:00" ? strTime : "12:00:00"
  return new Date(`${dateEvent}T${time}Z`).toISOString()
}

export function mapEvent(raw, knockoutPhaseMap = null) {
  if (!raw) return null
  const homeTeam = raw.strHomeTeam || raw.strTeamHome || ""
  const awayTeam = raw.strAwayTeam || raw.strTeamAway || ""
  const homeScore = parseScore(raw.intHomeScore ?? raw.intScoreHome)
  const awayScore = parseScore(raw.intAwayScore ?? raw.intScoreAway)
  const status = mapStatus(raw.strStatus || raw.strProgress)
  const eventId = String(raw.idEvent || raw.id || "")
  const knockoutPhase = knockoutPhaseMap?.[eventId] ?? null
  const phase = mapPhase(raw.strRound, raw.strGroup, raw.intRound, knockoutPhase)

  return {
    id: eventId,
    homeTeam,
    awayTeam,
    homeBadge: (raw.strHomeTeamBadge || raw.strHomeBadge || "").replace(/\/tiny$/, "") || null,
    awayBadge: (raw.strAwayTeamBadge || raw.strAwayBadge || "").replace(/\/tiny$/, "") || null,
    homeScore,
    awayScore,
    status,
    progress: raw.strProgress || raw.strStatus || null,
    kickoffAt: parseKickoff(raw.dateEvent, raw.strTime),
    venue: raw.strVenue || null,
    round: raw.strRound || raw.strGroup || null,
    phase,
    groupCode: phase === "group" ? resolveGroupCode(raw.strGroup, raw.strRound, homeTeam, awayTeam) : null,
  }
}

const TIMELINE_LABELS = [
  ["miss (pen shootout)", "Elfmeter verschossen"],
  ["missed penalty", "Elfmeter verschossen"],
  ["penalty", "Elfmeter"],
  ["goal", "Tor"],
  ["yellow card", "Gelbe Karte"],
  ["red card", "Rote Karte"],
  ["substitution", "Wechsel"],
  ["var", "VAR"],
]

export function mapTimelineEntry(raw) {
  if (!raw) return null
  const type = (raw.strTimelineDetail || raw.strTimeline || raw.strDetail || "").toLowerCase()
  let label = raw.strTimelineDetail || raw.strTimeline || raw.strDetail || "Ereignis"
  for (const [key, de] of TIMELINE_LABELS) {
    if (type.includes(key)) {
      label = de
      break
    }
  }
  if (/^[A-Z]\.\s/.test(label) || /^[A-Z]{2,}\s[A-Z]/.test(label)) {
    label = type.includes("subst") ? "Wechsel" : label
  }

  return {
    minute: raw.intTime || raw.strTime || raw.minute || "–",
    label,
    player: raw.strPlayer || raw.strPlayer1 || null,
    player2: raw.strPlayer2 || null,
    team: raw.strTeam || raw.strHomeAway || null,
    detail: raw.strComment || raw.strAssist || null,
  }
}

function resolveTimelineTeam(event, teamLabel) {
  if (!teamLabel || !event) return { teamName: teamLabel, badge: null, flagEmoji: null }
  const label = teamLabel.toLowerCase().trim()
  if (label === "home" || label === "heim") {
    return {
      teamName: event.homeTeam,
      badge: event.homeBadge,
      flagEmoji: event.homeFlagEmoji || getTeamFlagEmoji(event.homeTeam),
    }
  }
  if (label === "away" || label === "gast") {
    return {
      teamName: event.awayTeam,
      badge: event.awayBadge,
      flagEmoji: event.awayFlagEmoji || getTeamFlagEmoji(event.awayTeam),
    }
  }
  const home = event.homeTeam || ""
  const away = event.awayTeam || ""
  if (home && label.includes(home.toLowerCase())) {
    return { teamName: home, badge: event.homeBadge, flagEmoji: event.homeFlagEmoji || getTeamFlagEmoji(home) }
  }
  if (away && label.includes(away.toLowerCase())) {
    return { teamName: away, badge: event.awayBadge, flagEmoji: event.awayFlagEmoji || getTeamFlagEmoji(away) }
  }
  return { teamName: teamLabel, badge: null, flagEmoji: getTeamFlagEmoji(teamLabel) }
}

export function enrichEventBadges(event, teamBadges = {}) {
  const homeBadge = event.homeBadge || teamBadges[event.homeTeam] || null
  const awayBadge = event.awayBadge || teamBadges[event.awayTeam] || null
  return {
    ...event,
    homeBadge,
    awayBadge,
    homeFlagEmoji: getTeamFlagEmoji(event.homeTeam),
    awayFlagEmoji: getTeamFlagEmoji(event.awayTeam),
  }
}

export function mapTimeline(event, rawTimeline) {
  const items = Array.isArray(rawTimeline) ? rawTimeline : rawTimeline ? [rawTimeline] : []
  const enrichedEvent = enrichEventBadges(event)
  return {
    event: enrichedEvent,
    events: items
      .map(mapTimelineEntry)
      .filter(Boolean)
      .sort((a, b) => {
        const ma = parseInt(String(a.minute).replace(/[^\d]/g, ""), 10) || 0
        const mb = parseInt(String(b.minute).replace(/[^\d]/g, ""), 10) || 0
        return ma - mb
      })
      .map((entry) => {
        const resolved = resolveTimelineTeam(enrichedEvent, entry.team)
        return {
          ...entry,
          team: resolved.teamName,
          teamBadge: resolved.badge,
          teamFlagEmoji: resolved.flagEmoji,
        }
      }),
  }
}

function collectTeamBadges(scheduleRaw) {
  const badges = {}
  for (const e of scheduleRaw) {
    const home = e.strHomeTeam
    const away = e.strAwayTeam
    const homeBadge = e.strHomeTeamBadge || e.strHomeBadge
    const awayBadge = e.strAwayTeamBadge || e.strAwayBadge
    if (home && homeBadge) badges[home] = homeBadge.replace(/\/tiny$/, "")
    if (away && awayBadge) badges[away] = awayBadge.replace(/\/tiny$/, "")
  }
  return badges
}

function pickTimelineTargets(live, recent) {
  const targets = []
  for (const m of live.slice(0, 3)) {
    if (m.id) targets.push({ event: m, reason: "live" })
  }
  if (!targets.length) {
    const recap = recent.find((m) => m.status === "finished")
    if (recap?.id) targets.push({ event: recap, reason: "recap" })
  }
  return targets
}

export async function fetchScreenData() {
  const { apiKey, leagueId, season } = getDisplayConfig()
  if (!apiKey) {
    throw new Error("SPORTSDB_API_KEY fehlt")
  }

  const [liveRaw, nextRaw, scheduleRaw] = await Promise.all([
    fetchLeagueLivescore(apiKey, leagueId).catch(() => []),
    fetchNextEvents(apiKey, leagueId).catch(() => []),
    fetchFullSchedule(apiKey, leagueId, season).catch(() => []),
  ])

  const seasonSchedule = scheduleRaw.filter(isEventSeason2026)
  const knockoutPhaseMap = buildKnockoutPhaseMap(seasonSchedule)
  const teamBadges = collectTeamBadges(seasonSchedule)
  const mapWithPhase = (raw) => mapEvent(raw, knockoutPhaseMap)
  const allSeasonMatches = seasonSchedule.map(mapWithPhase).filter(Boolean)

  const live = liveRaw.map(mapWithPhase).filter(Boolean)
  const upcoming = nextRaw
    .filter(isEventSeason2026)
    .map(mapWithPhase)
    .filter(Boolean)
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => new Date(a.kickoffAt) - new Date(b.kickoffAt))
    .slice(0, 8)

  const recent = allSeasonMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoffAt) - new Date(a.kickoffAt))
    .slice(0, 8)

  const tables = computeGroupStandings(allSeasonMatches, teamBadges)

  const timelineTargets = pickTimelineTargets(live, recent)
  const timelines = []

  for (const { event, reason } of timelineTargets) {
    try {
      const raw = await fetchEventTimeline(apiKey, event.id)
      const mapped = mapTimeline(enrichEventBadges(event, teamBadges), raw)
      if (mapped.events.length) {
        timelines.push({ ...mapped, reason })
      }
    } catch {
      // Timeline optional – Spiel ohne Events überspringen
    }
  }

  const knockout = allSeasonMatches
    .filter((m) => m.phase !== "group")
    .sort((a, b) => {
      const phaseOrder = { r32: 0, r16: 1, qf: 2, sf: 3, final: 4, final3: 5 }
      const pd = (phaseOrder[a.phase] ?? 99) - (phaseOrder[b.phase] ?? 99)
      if (pd !== 0) return pd
      return new Date(a.kickoffAt) - new Date(b.kickoffAt)
    })

  return {
    updatedAt: new Date().toISOString(),
    leagueId,
    season,
    live,
    upcoming,
    recent,
    timelines,
    tables,
    knockout,
  }
}
