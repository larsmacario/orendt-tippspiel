export const KICKTIPP_MATCH_WINDOW = 5
export const SCREEN_TOP_LIMIT = 15

export const SUMMARY_LEGEND = [
  { key: "P", label: "Punkte in den letzten 5 Spielen", accent: true },
  { key: "B", label: "WM-Bonus" },
  { key: "S", label: "Schnitt pro getipptem Spiel" },
  { key: "G", label: "Gesamtpunkte", bold: true },
]

function predictionKey(userId, matchId) {
  return `${userId}:${matchId}`
}

export function formatTeamCode(team, placeholder) {
  if (team?.code) return team.code.toUpperCase()
  const name = team?.name || placeholder
  if (!name || name === "TBD") return "–"
  return name.slice(0, 3).toUpperCase()
}

export function formatWindowAverage(windowPoints, tippedCount) {
  if (!tippedCount) return "–"
  return (windowPoints / tippedCount).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatRankDelta(delta) {
  if (delta == null || delta === 0) return ""
  return delta > 0 ? `+${delta}` : String(delta)
}

export function buildKicktippRows({
  leaderboard = [],
  matches = [],
  predictions = [],
  snapshots = [],
}) {
  const snapshotByUser = new Map()
  snapshots.forEach((row) => snapshotByUser.set(row.user_id, row.rank))

  const predMap = new Map()
  predictions.forEach((p) => {
    predMap.set(predictionKey(p.user_id, p.match_id), p)
  })

  const matchIds = matches.map((m) => m.id)

  return leaderboard.map((player, index) => {
    const currentRank = index + 1
    const snapshotRank = snapshotByUser.get(player.user_id)
    const rankDelta =
      snapshotRank != null ? snapshotRank - currentRank : null

    let windowPoints = 0
    let tippedCount = 0
    const cells = matchIds.map((matchId) => {
      const pred = predMap.get(predictionKey(player.user_id, matchId))
      if (!pred) {
        return { homeTip: null, awayTip: null, points: null }
      }
      tippedCount += 1
      const points = pred.points ?? 0
      windowPoints += points
      return {
        homeTip: pred.home_tip,
        awayTip: pred.away_tip,
        points: pred.points,
      }
    })

    return {
      userId: player.user_id,
      displayName: player.display_name,
      rank: currentRank,
      rankDelta,
      rankDeltaLabel: formatRankDelta(rankDelta),
      cells,
      windowPoints,
      championBonus: player.champion_bonus ?? 0,
      windowAverage: formatWindowAverage(windowPoints, tippedCount),
      totalPoints: player.total_points ?? 0,
    }
  })
}
