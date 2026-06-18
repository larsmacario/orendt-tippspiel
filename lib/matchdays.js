import { getMatchdayKey, getBerlinTodayKey } from "./dates"
import { formatSnapshotMatchdayLabel } from "./leaderboard-matrix"

/**
 * Eindeutige Spieltags-Keys (YYYY-MM-DD, Berlin), chronologisch sortiert.
 */
export function collectMatchdayKeys(matches) {
  const keys = new Set()
  for (const match of matches || []) {
    const key = getMatchdayKey(match.kickoff_at)
    if (key) keys.add(key)
  }
  return [...keys].sort()
}

/**
 * Matches für die Spieltags-Leiste: Phase-Filter ja, „Tipp fehlt“ und Spieltag noch nicht.
 */
export function filterMatchesByPhasePool(matches, filter) {
  return (matches || []).filter((m) => {
    if (filter === "group" && m.phase !== "group") return false
    if (filter === "ko" && m.phase === "group") return false
    return true
  })
}

/**
 * Spieltags-Optionen für die UI: { key, label }
 */
export function buildMatchdayOptions(matches, filter) {
  const pool = filterMatchesByPhasePool(matches, filter)
  return collectMatchdayKeys(pool).map((key) => ({
    key,
    label: formatSnapshotMatchdayLabel(key) || key,
  }))
}

/**
 * Standard-Spieltag: heute (Berlin), falls im Pool vorhanden — sonst „all“.
 * @param {Array<{ key: string }>} matchdayOptions
 * @param {string} [todayKey] — optional für Tests
 */
export function resolveDefaultMatchdayKey(matchdayOptions, todayKey = getBerlinTodayKey()) {
  if (matchdayOptions?.some((o) => o.key === todayKey)) return todayKey
  return "all"
}
