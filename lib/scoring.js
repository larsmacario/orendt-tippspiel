/**
 * Kicker-style scoring: 4 exact, 3 goal diff (wins only), 2 tendency / 1 draw tendency, 0 wrong
 */
export function calcPoints(homeTip, awayTip, homeScore, awayScore) {
  if (
    homeTip == null || awayTip == null ||
    homeScore == null || awayScore == null
  ) return null

  const ht = Number(homeTip)
  const at = Number(awayTip)
  const hs = Number(homeScore)
  const as = Number(awayScore)

  if (ht === hs && at === as) return 4

  const tipDiff = ht - at
  const scoreDiff = hs - as

  if (tipDiff === scoreDiff && tipDiff !== 0) return 3

  const tipResult = tipDiff > 0 ? "home" : tipDiff < 0 ? "away" : "draw"
  const scoreResult = scoreDiff > 0 ? "home" : scoreDiff < 0 ? "away" : "draw"

  if (tipResult === scoreResult) {
    return tipResult === "draw" ? 1 : 2
  }

  return 0
}

export function getTendencyLabel(homeTip, awayTip) {
  const diff = Number(homeTip) - Number(awayTip)
  if (diff > 0) return "Heimsieg"
  if (diff < 0) return "Auswärtssieg"
  return "Unentschieden"
}
