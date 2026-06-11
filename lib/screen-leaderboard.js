import { createAdminClient } from "./supabase-admin"

export async function fetchScreenLeaderboard(limit = 10) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("tip_leaderboard")
      .select("display_name, total_points, exact_hits, champion_team_name, champion_badge_url")
      .order("total_points", { ascending: false })
      .order("exact_hits", { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((row, index) => ({
      rank: index + 1,
      displayName: row.display_name,
      totalPoints: row.total_points ?? 0,
      exactHits: row.exact_hits ?? 0,
      championTeamName: row.champion_team_name || null,
      championBadgeUrl: row.champion_badge_url || null,
    }))
  } catch {
    return []
  }
}
