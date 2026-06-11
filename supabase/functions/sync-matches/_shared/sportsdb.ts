const BASE_URL = "https://www.thesportsdb.com/api/v2/json"

export function getConfig() {
  const apiKey = Deno.env.get("SPORTSDB_API_KEY") || ""
  const leagueId = Deno.env.get("SPORTSDB_LEAGUE_ID") || "4429"
  const season = Deno.env.get("SPORTSDB_SEASON") || "2026"
  return { apiKey, leagueId, season }
}

async function sportsDbFetch(path: string, apiKey: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TheSportsDB ${res.status}: ${text}`)
  }
  return res.json()
}

export async function fetchTeams(apiKey: string, leagueId: string) {
  const data = await sportsDbFetch(`/list/teams/${leagueId}`, apiKey)
  return data?.list || data?.teams || []
}

export async function fetchSeasons(apiKey: string, leagueId: string) {
  const data = await sportsDbFetch(`/list/seasons/${leagueId}`, apiKey)
  return data?.list || data?.seasons || []
}

export async function fetchSchedule(apiKey: string, leagueId: string, season: string) {
  const data = await sportsDbFetch(`/schedule/league/${leagueId}/${encodeURIComponent(season)}`, apiKey)
  return data?.schedule || data?.events || []
}

export async function fetchLiveScores(apiKey: string) {
  const data = await sportsDbFetch("/livescore/soccer", apiKey)
  return data?.livescore || data?.events || []
}

export async function fetchLeagueLivescore(apiKey: string, leagueId: string) {
  const data = await sportsDbFetch(`/livescore/${leagueId}`, apiKey)
  return data?.livescore || data?.events || []
}

export async function fetchNextEvents(apiKey: string, leagueId: string) {
  const data = await sportsDbFetch(`/schedule/next/league/${leagueId}`, apiKey)
  return data?.schedule || data?.events || []
}

export async function fetchPreviousEvents(apiKey: string, leagueId: string) {
  const data = await sportsDbFetch(`/schedule/previous/league/${leagueId}`, apiKey)
  return data?.schedule || data?.events || []
}

export async function fetchEventTimeline(apiKey: string, eventId: string) {
  const data = await sportsDbFetch(`/lookup/event_timeline/${eventId}`, apiKey)
  return data?.timeline || data?.lookup || data?.event || []
}

export function mapStatus(raw: string | null | undefined): "scheduled" | "live" | "finished" {
  const s = (raw || "").toLowerCase()
  if (s.includes("finished") || s.includes("ft") || s.includes("aet") || s.includes("pen")) return "finished"
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht") || s.includes("et") || s.includes("pen")) return "live"
  if (s.includes("not started") || s.includes("ns") || s.includes("scheduled") || s === "") return "scheduled"
  return "scheduled"
}

export function mapPhase(strRound: string | null | undefined, strGroup: string | null | undefined): string {
  const r = (strRound || strGroup || "").toLowerCase()
  if (r.includes("group") || /^group [a-l]$/i.test(strRound || "")) return "group"
  if (r.includes("round of 32") || r.includes("32")) return "r32"
  if (r.includes("round of 16") || r.includes("8th") || r.includes("last 16")) return "r16"
  if (r.includes("quarter")) return "qf"
  if (r.includes("semi")) return "sf"
  if (r.includes("3rd") || r.includes("third")) return "final3"
  if (r.includes("final")) return "final"
  return "group"
}

/** Offizielle WM-2026-Gruppen (Auslosung 05.12.2025) */
const TEAM_GROUP: Record<string, string> = {
  Mexico: "A", "South Africa": "A", "South Korea": "A", "Czech Republic": "A",
  Canada: "B", Switzerland: "B", Qatar: "B", "Bosnia-Herzegovina": "B",
  Brazil: "C", Morocco: "C", Scotland: "C", Haiti: "C",
  USA: "D", Paraguay: "D", Australia: "D", Turkey: "D",
  Germany: "E", Ecuador: "E", "Ivory Coast": "E", "Curaçao": "E",
  Netherlands: "F", Japan: "F", Tunisia: "F", Sweden: "F",
  Belgium: "G", Iran: "G", Egypt: "G", "New Zealand": "G",
  Spain: "H", Uruguay: "H", "Saudi Arabia": "H", "Cape Verde": "H",
  France: "I", Senegal: "I", Norway: "I", Iraq: "I",
  Argentina: "J", Austria: "J", Algeria: "J", Jordan: "J",
  Portugal: "K", Colombia: "K", Uzbekistan: "K", "DR Congo": "K",
  England: "L", Croatia: "L", Panama: "L", Ghana: "L",
}

export function lookupTeamGroup(teamName: string | null | undefined): string | null {
  if (!teamName) return null
  return TEAM_GROUP[teamName] || null
}

export function extractGroupCode(strGroup: string | null | undefined, strRound: string | null | undefined): string | null {
  const source = strGroup || strRound || ""
  const match = source.match(/group\s*([A-L])/i) || source.match(/^([A-L])$/i)
  return match ? match[1].toUpperCase() : null
}

export function resolveGroupCode(
  strGroup: string | null | undefined,
  strRound: string | null | undefined,
  teamName?: string | null
): string | null {
  return extractGroupCode(strGroup, strRound) || lookupTeamGroup(teamName)
}

export function parseKickoff(dateEvent: string, strTime: string | null | undefined): string {
  const time = strTime && strTime !== "00:00:00" ? strTime : "12:00:00"
  const iso = `${dateEvent}T${time}Z`
  return new Date(iso).toISOString()
}

export function parseScore(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = parseInt(String(value), 10)
  return isNaN(n) ? null : n
}

export function parseEventScores(event: Record<string, string | number | null | undefined>) {
  return {
    homeScore: parseScore(event.intHomeScore ?? event.intScoreHome),
    awayScore: parseScore(event.intAwayScore ?? event.intScoreAway),
  }
}

const COUNTRY_FLAGS: Record<string, string> = {
  Germany: "🇩🇪", France: "🇫🇷", Spain: "🇪🇸", Italy: "🇮🇹", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Brazil: "🇧🇷", Argentina: "🇦🇷", Portugal: "🇵🇹", Netherlands: "🇳🇱", Belgium: "🇧🇪",
  USA: "🇺🇸", Mexico: "🇲🇽", Canada: "🇨🇦", Japan: "🇯🇵", "South Korea": "🇰🇷",
}

export function countryToEmoji(country: string | null | undefined): string | null {
  if (!country) return null
  return COUNTRY_FLAGS[country] || null
}
