import { createAdminClient } from "./supabase-admin"
import {
  buildKicktippRows,
  KICKTIPP_MATCH_WINDOW,
  SCREEN_TOP_LIMIT,
} from "./leaderboard-matrix"

const MATCH_SELECT = `
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

export async function fetchScreenKicktippLeaderboard() {
  try {
    const supabase = createAdminClient()

    const [leaderboardRes, matchesRes, snapshotsRes] = await Promise.all([
      supabase.from("tip_leaderboard").select("*"),
      supabase
        .from("tip_matches")
        .select(MATCH_SELECT)
        .eq("status", "finished")
        .order("kickoff_at", { ascending: false })
        .limit(KICKTIPP_MATCH_WINDOW),
      supabase
        .from("tip_rank_snapshots")
        .select("matchday_key")
        .order("matchday_key", { ascending: false })
        .limit(1),
    ])

    if (leaderboardRes.error) throw leaderboardRes.error
    if (matchesRes.error) throw matchesRes.error
    if (snapshotsRes.error) throw snapshotsRes.error

    const matches = [...(matchesRes.data || [])].reverse()
    const matchIds = matches.map((m) => m.id)

    let predictions = []
    if (matchIds.length) {
      const { data: profiles } = await supabase
        .from("tip_profiles")
        .select("id")
        .eq("is_active", true)
        .eq("is_blocked", false)

      const activeIds = (profiles || []).map((p) => p.id)
      if (activeIds.length) {
        const { data: preds, error: predError } = await supabase
          .from("tip_predictions")
          .select("match_id, user_id, home_tip, away_tip, points")
          .in("match_id", matchIds)
          .in("user_id", activeIds)

        if (predError) throw predError
        predictions = preds || []
      }
    }

    let snapshots = []
    const snapshotMatchday = snapshotsRes.data?.[0]?.matchday_key ?? null
    if (snapshotMatchday) {
      const { data: snapData, error: snapError } = await supabase
        .from("tip_rank_snapshots")
        .select("user_id, rank, total_points, matchday_key")
        .eq("matchday_key", snapshotMatchday)

      if (snapError) throw snapError
      snapshots = snapData || []
    }

    const rows = buildKicktippRows({
      leaderboard: leaderboardRes.data || [],
      matches,
      predictions,
      snapshots,
    }).slice(0, SCREEN_TOP_LIMIT)

    return { rows, matches, snapshotMatchday }
  } catch {
    return { rows: [], matches: [], snapshotMatchday: null }
  }
}
