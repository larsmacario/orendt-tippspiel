/** @typedef {"r32"|"r16"|"qf"|"sf"|"final"|"final3"} KnockoutPhase */

export const KO_ROUND_ORDER = ["r32", "r16", "qf", "sf", "final"]

export const KO_ROUND_LABELS = {
  r32: "Letzte 32",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  final: "Finale",
  final3: "Spiel um Platz 3",
}

export const KO_PHASES = new Set([...KO_ROUND_ORDER, "final3"])

/** Basis-Rasterzeilen für vertikale Slot-Ausrichtung (16 Spiele in Runde 1). */
export const BRACKET_GRID_ROWS = 32

const SLOT_HEIGHT = 2

/**
 * Normalisiert Supabase- und Screen-Match-Objekte auf ein gemeinsames Format.
 */
export function normalizeKnockoutMatch(match) {
  if (!match) return null

  const homeTeamObj = match.home_team || null
  const awayTeamObj = match.away_team || null

  return {
    id: match.id,
    phase: match.phase,
    sortOrder: match.sort_order ?? match.sortOrder ?? 0,
    kickoffAt: match.kickoff_at ?? match.kickoffAt ?? null,
    status: match.status || "scheduled",
    homeScore: match.home_score ?? match.homeScore ?? null,
    awayScore: match.away_score ?? match.awayScore ?? null,
    homeTeam: homeTeamObj,
    awayTeam: awayTeamObj,
    homeName: homeTeamObj?.name || match.placeholder_home || match.homeTeam || "TBD",
    awayName: awayTeamObj?.name || match.placeholder_away || match.awayTeam || "TBD",
    homeBadge: homeTeamObj?.badge_url || match.homeBadge || null,
    awayBadge: awayTeamObj?.badge_url || match.awayBadge || null,
    homeFlagEmoji: homeTeamObj?.flag_emoji || match.homeFlagEmoji || null,
    awayFlagEmoji: awayTeamObj?.flag_emoji || match.awayFlagEmoji || null,
    placeholderHome: match.placeholder_home || null,
    placeholderAway: match.placeholder_away || null,
    raw: match,
  }
}

/**
 * @returns {"home"|"away"|null}
 */
export function getMatchWinner(match) {
  const m = normalizeKnockoutMatch(match)
  if (!m || m.status !== "finished") return null
  if (m.homeScore == null || m.awayScore == null) return null
  if (m.homeScore > m.awayScore) return "home"
  if (m.awayScore > m.homeScore) return "away"
  return null
}

function sortMatchesInRound(a, b) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  const ka = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0
  const kb = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0
  return ka - kb
}

/**
 * Berechnet die Grid-Zeile (0-basiert) für einen Slot in einer Runde.
 */
export function getBracketRowStart(roundIndex, slotIndex) {
  const blockSize = 2 ** (roundIndex + 1)
  return slotIndex * blockSize + 2 ** roundIndex - 1
}

/**
 * @param {object[]} matches
 * @returns {{
 *   rounds: Array<{ phase: KnockoutPhase, label: string, roundIndex: number, slots: object[] }>,
 *   final3: object | null,
 *   gridRows: number,
 *   slotHeight: number,
 * }}
 */
export function buildKnockoutBracket(matches) {
  const normalized = (matches || [])
    .map(normalizeKnockoutMatch)
    .filter((m) => m && KO_PHASES.has(m.phase))

  const byPhase = {}
  for (const m of normalized) {
    if (!byPhase[m.phase]) byPhase[m.phase] = []
    byPhase[m.phase].push(m)
  }

  const rounds = KO_ROUND_ORDER.map((phase, roundIndex) => {
    const phaseMatches = (byPhase[phase] || []).sort(sortMatchesInRound)
    const slots = phaseMatches.map((match, slotIndex) => ({
      match,
      slotIndex,
      rowStart: getBracketRowStart(roundIndex, slotIndex),
      rowSpan: SLOT_HEIGHT,
    }))
    return {
      phase,
      label: KO_ROUND_LABELS[phase],
      roundIndex,
      slots,
    }
  }).filter((round) => round.slots.length > 0)

  const final3Matches = (byPhase.final3 || []).sort(sortMatchesInRound)
  const final3 = final3Matches[0]
    ? {
        match: final3Matches[0],
        slotIndex: 0,
        rowStart: BRACKET_GRID_ROWS - SLOT_HEIGHT,
        rowSpan: SLOT_HEIGHT,
      }
    : null

  return {
    rounds,
    final3,
    gridRows: BRACKET_GRID_ROWS,
    slotHeight: SLOT_HEIGHT,
  }
}

/**
 * Connector-Linien zwischen zwei aufeinanderfolgenden Runden.
 * @returns {Array<{ x1: number, y1: number, x2: number, y2: number, x3: number, y3: number }>}
 */
export function buildConnectorPaths(bracket, { columnWidth, rowHeight, slotWidth }) {
  const paths = []
  const { rounds, slotHeight } = bracket

  for (let r = 0; r < rounds.length - 1; r++) {
    const current = rounds[r]
    const next = rounds[r + 1]
    const xStart = (r + 1) * columnWidth - (columnWidth - slotWidth) / 2
    const xMid = xStart + (columnWidth - slotWidth) / 4
    const xEnd = (r + 1) * columnWidth + (columnWidth - slotWidth) / 2

    for (const child of current.slots) {
      const parentIndex = Math.floor(child.slotIndex / 2)
      const parent = next.slots[parentIndex]
      if (!parent) continue

      const childCenterY = (child.rowStart + slotHeight / 2) * rowHeight
      const parentCenterY = (parent.rowStart + slotHeight / 2) * rowHeight

      paths.push({
        x1: xStart,
        y1: childCenterY,
        x2: xMid,
        y2: childCenterY,
        x3: xMid,
        y3: parentCenterY,
        x4: xEnd,
        y4: parentCenterY,
      })
    }
  }

  return paths
}
