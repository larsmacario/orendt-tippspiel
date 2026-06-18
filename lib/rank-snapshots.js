import { getMatchdayKey } from "./dates"

export function pickLastMatchdayBaseline(completedMatchdays = []) {
  const sorted = [...new Set(completedMatchdays.filter(Boolean))].sort()
  const lastMatchday = sorted.at(-1) ?? null
  const baselineMatchday = sorted.length >= 2 ? sorted.at(-2) : null
  return { lastMatchday, baselineMatchday }
}

export function collectCompletedMatchdays(matches = []) {
  const byDay = new Map()

  for (const match of matches) {
    const key = getMatchdayKey(match.kickoff_at)
    if (!key) continue
    const group = byDay.get(key) || { total: 0, finished: 0 }
    group.total += 1
    if (match.status === "finished") group.finished += 1
    byDay.set(key, group)
  }

  return [...byDay.entries()]
    .filter(([, group]) => group.total > 0 && group.total === group.finished)
    .map(([key]) => key)
    .sort()
}

export async function getLastMatchdayRankSnapshots(supabase) {
  const { data: matches, error: matchError } = await supabase
    .from("tip_matches")
    .select("kickoff_at, status")

  if (matchError) {
    return { data: [], matchdayKey: null, baselineMatchday: null, error: matchError }
  }

  const { lastMatchday, baselineMatchday } = pickLastMatchdayBaseline(
    collectCompletedMatchdays(matches || [])
  )

  if (!baselineMatchday) {
    return { data: [], matchdayKey: lastMatchday, baselineMatchday: null, error: null }
  }

  const { data, error } = await supabase
    .from("tip_rank_snapshots")
    .select("user_id, rank, total_points, matchday_key")
    .eq("matchday_key", baselineMatchday)

  return {
    data: data || [],
    matchdayKey: lastMatchday,
    baselineMatchday,
    error,
  }
}
