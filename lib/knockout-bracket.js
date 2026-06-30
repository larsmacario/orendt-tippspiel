/** @typedef {"r32"|"r16"|"qf"|"sf"|"final"|"final3"} KnockoutPhase */

import {
  EXTERNAL_ID_TO_FIFA_MATCH_NO,
  KO_FINAL_NODE,
  KO_QF_MATCH_NOS_BY_SLOT,
  KO_R16_TREE,
  KO_SF_TREE,
  getFifaMatchNumber,
  getSlotKnockoutMatchNo,
  isProjectedKnockoutMatch,
  sortMatchesByBracketLeafOrder,
} from "./knockout-bracket-tree.js"

export { isProjectedKnockoutMatch } from "./knockout-bracket-tree.js"

export const KO_ROUND_ORDER = ["r32", "r16", "qf", "sf", "final"]

export const KO_ROUND_LABELS = {
  r32: "Runde der letzten 32",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  final: "Finale",
  final3: "Spiel um Platz 3",
}

export const KO_PHASES = new Set([...KO_ROUND_ORDER, "final3"])

/** Basis-Rasterzeilen für vertikale Slot-Ausrichtung (16 Spiele in Runde 1). */
export const BRACKET_GRID_ROWS = 32

/** Rasterzeilen pro Karte. */
export const CARD_GRID_ROWS = 2

/** Leerzeilen zwischen zwei Karten in Runde 1 (1 = kompakter Abstand). */
export const CARD_GAP_GRID_ROWS = 1

const SLOT_STEP = CARD_GRID_ROWS + CARD_GAP_GRID_ROWS

/**
 * Normalisiert Supabase- und Screen-Match-Objekte auf ein gemeinsames Format.
 */
export function normalizeKnockoutMatch(match) {
  if (!match) return null

  const homeTeamObj = match.home_team || match.homeTeam || null
  const awayTeamObj = match.away_team || match.awayTeam || null

  return {
    id: match.id,
    phase: match.phase,
    sortOrder: match.sort_order ?? match.sortOrder ?? 0,
    kickoffAt: match.kickoff_at ?? match.kickoffAt ?? null,
    status: match.status || "scheduled",
    homeScore: match.home_score ?? match.homeScore ?? null,
    awayScore: match.away_score ?? match.awayScore ?? null,
    homePenScore: match.home_pen_score ?? match.homePenScore ?? null,
    awayPenScore: match.away_pen_score ?? match.awayPenScore ?? null,
    rawStatus: match.raw_status ?? match.rawStatus ?? null,
    homeTeam: homeTeamObj,
    awayTeam: awayTeamObj,
    homeName: homeTeamObj?.name || match.placeholder_home || (typeof match.homeTeam === "string" ? match.homeTeam : null) || "TBD",
    awayName: awayTeamObj?.name || match.placeholder_away || (typeof match.awayTeam === "string" ? match.awayTeam : null) || "TBD",
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
  if (m.homePenScore != null && m.awayPenScore != null) {
    if (m.homePenScore > m.awayPenScore) return "home"
    if (m.awayPenScore > m.homePenScore) return "away"
  }
  return null
}

export function hasPenaltyShootoutResult(match) {
  const m = normalizeKnockoutMatch(match)
  return m?.homePenScore != null && m?.awayPenScore != null
}

function resolveKnockoutPhase(match) {
  const externalId = match?.raw?.external_id ?? match?.external_id
  if (externalId && EXTERNAL_ID_TO_FIFA_MATCH_NO[String(externalId)]) return "r32"
  return match.phase
}

function extractWinnerSide(slot) {
  if (!slot?.match) return null
  const m = slot.match.homeName != null ? slot.match : normalizeKnockoutMatch(slot.match)
  const winner = getMatchWinner(m.raw ?? m)
  if (!winner) return null
  if (winner === "home") {
    return { team: m.homeTeam, name: m.homeName, badge: m.homeBadge, flag: m.homeFlagEmoji }
  }
  return { team: m.awayTeam, name: m.awayName, badge: m.awayBadge, flag: m.awayFlagEmoji }
}

function composeProjectedMatch(parentA, parentB, phase, matchNo, slotIndex) {
  const home = extractWinnerSide(parentA)
  const away = extractWinnerSide(parentB)

  return normalizeKnockoutMatch({
    id: `${phase}-proj-${matchNo}`,
    phase,
    sort_order: slotIndex,
    status: "scheduled",
    home_team: home?.team ?? null,
    away_team: away?.team ?? null,
    placeholder_home: home?.name ?? "Noch offen",
    placeholder_away: away?.name ?? "Noch offen",
    kickoff_at: null,
  })
}

function buildTreeProjectedSlots(parentSlots, tree, phase, roundIndex, getParentKey, getMatchNo) {
  const slotByKey = new Map()
  for (const slot of parentSlots) {
    const key = getParentKey(slot)
    if (key != null) slotByKey.set(key, slot)
  }

  return tree.map((node, slotIndex) => ({
    match: composeProjectedMatch(
      slotByKey.get(node.parents[0]),
      slotByKey.get(node.parents[1]),
      phase,
      getMatchNo(node),
      slotIndex
    ),
    slotIndex,
    rowStart: getBracketRowStart(roundIndex, slotIndex),
    rowSpan: CARD_GRID_ROWS,
  }))
}

function buildBinaryProjectedSlots(parentSlots, phase, roundIndex, matchNosBySlot) {
  const count = Math.floor(parentSlots.length / 2)
  return Array.from({ length: count }, (_, slotIndex) => ({
    match: composeProjectedMatch(
      parentSlots[slotIndex * 2],
      parentSlots[slotIndex * 2 + 1],
      phase,
      matchNosBySlot[slotIndex],
      slotIndex
    ),
    slotIndex,
    rowStart: getBracketRowStart(roundIndex, slotIndex),
    rowSpan: CARD_GRID_ROWS,
  }))
}

function buildR16ProjectedSlots(r32Slots, roundIndex) {
  return buildTreeProjectedSlots(
    r32Slots,
    KO_R16_TREE,
    "r16",
    roundIndex,
    (slot) => getFifaMatchNumber(slot.match),
    (node) => node.r16MatchNo
  )
}

function sortMatchesInRound(a, b) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  const ka = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0
  const kb = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0
  return ka - kb
}

/**
 * Vertikale Mitte eines Slots im Raster (0-basiert).
 */
export function getSlotCenterRow(rowStart, rowSpan = CARD_GRID_ROWS) {
  return rowStart + rowSpan / 2
}

/**
 * Berechnet die Grid-Zeile (0-basiert) für einen Slot in einer Runde.
 * Erste Runde: Karte + kleine Lücke + nächste Karte.
 * Folgerunden: Mittelpunkt zwischen den Mittelpunkten der Kind-Slots.
 */
export function getBracketRowStart(roundIndex, slotIndex) {
  if (roundIndex === 0) {
    return slotIndex * SLOT_STEP
  }
  const child0 = getBracketRowStart(roundIndex - 1, slotIndex * 2)
  const child1 = getBracketRowStart(roundIndex - 1, slotIndex * 2 + 1)
  const parentCenter = (getSlotCenterRow(child0) + getSlotCenterRow(child1)) / 2
  return parentCenter - CARD_GRID_ROWS / 2
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
    .map((m) => ({ ...m, phase: resolveKnockoutPhase(m) }))

  const byPhase = {}
  for (const m of normalized) {
    if (!byPhase[m.phase]) byPhase[m.phase] = []
    byPhase[m.phase].push(m)
  }

  const rounds = KO_ROUND_ORDER.map((phase, roundIndex) => {
    const phaseMatches =
      phase === "r32"
        ? sortMatchesByBracketLeafOrder(byPhase[phase] || [])
        : (byPhase[phase] || []).sort(sortMatchesInRound)
    const slots = phaseMatches.map((match, slotIndex) => ({
      match,
      slotIndex,
      rowStart: getBracketRowStart(roundIndex, slotIndex),
      rowSpan: CARD_GRID_ROWS,
    }))
    return {
      phase,
      label: KO_ROUND_LABELS[phase],
      roundIndex,
      slots,
    }
  }).filter((round) => round.slots.length > 0)

  const firstRound = rounds[0]
  const firstRoundSlots = firstRound?.slots.length ?? 0
  const gridRows = firstRoundSlots > 0
    ? (firstRoundSlots - 1) * SLOT_STEP + CARD_GRID_ROWS
    : BRACKET_GRID_ROWS

  const final3Matches = (byPhase.final3 || []).sort(sortMatchesInRound)
  const final3 = final3Matches[0]
    ? {
        match: final3Matches[0],
        slotIndex: 0,
        rowStart: gridRows - CARD_GRID_ROWS,
        rowSpan: CARD_GRID_ROWS,
      }
    : null

  return {
    rounds,
    final3,
    gridRows,
    slotHeight: CARD_GRID_ROWS,
  }
}

/**
 * Konvertiert K.o.-Spiele in das Datenformat von react-brackets.
 * depth=1: nur erste K.o.-Runde (alle Letzten-32-Spiele in einer Spalte).
 * depth≥2: erste Runde mit Platzhaltern für Connector-Geometrie + Folgerunden.
 * @see https://github.com/mohux/react-brackets#readme
 */
export function matchesToReactBracketRounds(matches, { depth = 1 } = {}) {
  const bracket = buildKnockoutBracket(matches)
  const visibleRounds = ensureVisibleRounds(bracket, depth)
  const multiRound = visibleRounds.length > 1

  const rounds = visibleRounds.map((round, roundIndex) => {
    let slotMatches = round.slots.map((slot) => slot.match)

    if (roundIndex > 0) {
      const prevMatchCount = visibleRounds[roundIndex - 1].slots.length
      slotMatches = alignChildRoundMatches(slotMatches, round.phase, prevMatchCount)
    }

    let seeds
    if (roundIndex === 0 && multiRound) {
      seeds = interleavePlaceholderSeeds(slotMatches, round.phase)
    } else if (roundIndex > 0 && multiRound) {
      const parentMatchCount = visibleRounds[roundIndex - 1].slots.length
      seeds = alignChildRoundSeeds(parentMatchCount, slotMatches, round.phase)
    } else {
      seeds = slotMatches.map((match) => toReactBracketSeed(match))
    }

    return {
      title: round.label,
      phase: round.phase,
      seeds,
    }
  })

  return { rounds, final3: depth >= bracket.rounds.length ? bracket.final3 : null }
}

/** Stellt sicher, dass bei depth > 1 die nächste K.o.-Runde existiert (ggf. mit TBD-Slots). */
function ensureVisibleRounds(bracket, depth) {
  if (!bracket.rounds.length || depth < 1) return []

  const byPhase = Object.fromEntries(bracket.rounds.map((r) => [r.phase, r]))
  const firstPhase = bracket.rounds[0].phase
  const startIdx = KO_ROUND_ORDER.indexOf(firstPhase)
  if (startIdx === -1) return bracket.rounds.slice(0, depth)

  const result = []
  for (let i = 0; i < depth && startIdx + i < KO_ROUND_ORDER.length; i++) {
    const phase = KO_ROUND_ORDER[startIdx + i]
    const existing = byPhase[phase]
    if (existing) {
      result.push({ ...existing, roundIndex: i })
      continue
    }

    const parentRound = result[i - 1]
    if (!parentRound) break

    const expected = Math.max(1, Math.floor(parentRound.slots.length / 2))
    const slots = Array.from({ length: expected }, (_, slotIndex) => ({
      match: createTbdMatch(phase, slotIndex),
      slotIndex,
      rowStart: getBracketRowStart(i, slotIndex),
      rowSpan: CARD_GRID_ROWS,
    }))
    result.push({
      phase,
      label: KO_ROUND_LABELS[phase],
      roundIndex: i,
      slots,
    })
  }

  return result
}

/**
 * K.o.-Baum für die UI: projiziert Folgerunden aus Siegern der Elternrunde.
 * depth=2 nur AF; Standard depth=5 = Letzte 32 bis Finale.
 */
export function buildVisibleKnockoutBracket(matches, { depth = KO_ROUND_ORDER.length } = {}) {
  const bracket = buildKnockoutBracket(matches)
  const r32Round = bracket.rounds.find((r) => r.phase === "r32")

  if (!r32Round || depth < 2) {
    const rounds = bracket.rounds.slice(0, depth)
    const firstRound = rounds[0]
    const gridRows =
      firstRound && firstRound.slots.length > 0
        ? (firstRound.slots.length - 1) * SLOT_STEP + CARD_GRID_ROWS
        : bracket.gridRows
    return { ...bracket, rounds, gridRows }
  }

  const rounds = [r32Round]
  let parentSlots = r32Round.slots
  const targetPhases = KO_ROUND_ORDER.slice(1, depth)

  for (const phase of targetPhases) {
    const roundIndex = rounds.length
    let slots

    if (phase === "r16") {
      slots = buildR16ProjectedSlots(r32Round.slots, roundIndex)
    } else if (phase === "qf") {
      slots = buildBinaryProjectedSlots(parentSlots, phase, roundIndex, KO_QF_MATCH_NOS_BY_SLOT)
    } else if (phase === "sf") {
      slots = buildTreeProjectedSlots(
        parentSlots,
        KO_SF_TREE,
        phase,
        roundIndex,
        getSlotKnockoutMatchNo,
        (node) => node.sfMatchNo
      )
    } else if (phase === "final") {
      slots = buildTreeProjectedSlots(
        parentSlots,
        [KO_FINAL_NODE],
        phase,
        roundIndex,
        getSlotKnockoutMatchNo,
        (node) => node.finalMatchNo
      )
    } else {
      break
    }

    rounds.push({
      phase,
      label: KO_ROUND_LABELS[phase],
      roundIndex,
      slots,
    })
    parentSlots = slots
  }

  const gridRows = (r32Round.slots.length - 1) * SLOT_STEP + CARD_GRID_ROWS

  return { ...bracket, rounds, gridRows }
}

/** Achtelfinale = halb so viele Spiele wie R32; fehlende Slots als „Noch offen“. */
function alignChildRoundMatches(matches, phase, parentMatchCount) {
  const expected = Math.floor(parentMatchCount / 2)
  const trimmed = matches.slice(0, expected)
  const result = [...trimmed]
  while (result.length < expected) {
    result.push(createTbdMatch(phase, result.length))
  }
  return result
}

export function createTbdMatch(phase, sortOrder) {
  return normalizeKnockoutMatch({
    id: `tbd-${phase}-${sortOrder}`,
    phase,
    sort_order: sortOrder,
    status: "scheduled",
    placeholder_home: "Noch offen",
    placeholder_away: "Noch offen",
  })
}

function toReactBracketSeed(match) {
  return {
    id: match.id,
    date: match.kickoffAt,
    teams: [{ name: match.homeName }, { name: match.awayName }],
    match,
  }
}

function createPlaceholderSeed(id) {
  return {
    id,
    isPlaceholder: true,
    teams: [{ name: "" }, { name: "" }],
  }
}

/** Platzhalter + Match abwechselnd – erforderlich für korrekte Connector-Geometrie in Runde 1. */
function interleavePlaceholderSeeds(matches, phase) {
  const seeds = []
  for (let i = 0; i < matches.length; i++) {
    seeds.push(createPlaceholderSeed(`${phase}-placeholder-${i}`))
    seeds.push(toReactBracketSeed(matches[i]))
  }
  return seeds
}

/**
 * Folgerunden: gleiche Seed-Anzahl wie Elternrunde, Matches an Connector-Mittelpunkten (2, 6, 10, …).
 */
function alignChildRoundSeeds(parentMatchCount, matches, phase) {
  const parentSeedCount = parentMatchCount * 2
  const matchByIndex = new Map()
  matches.forEach((match, k) => {
    matchByIndex.set(2 + k * 4, match)
  })

  const seeds = []
  for (let i = 0; i < parentSeedCount; i++) {
    const match = matchByIndex.get(i)
    seeds.push(match ? toReactBracketSeed(match) : createPlaceholderSeed(`${phase}-spacer-${i}`))
  }
  return seeds
}

/**
 * SVG-Pfad für eine Bracket-Gabel: zwei horizontale Äste, vertikale Brücke, Ausgang zur Parent-Karte.
 */
export function buildBracketConnectorPath({
  xStart,
  xBridge,
  xEnd,
  yTop,
  yBottom,
  yMid,
  cornerRadius = 0,
}) {
  const yT = Math.min(yTop, yBottom)
  const yB = Math.max(yTop, yBottom)
  const yM = yMid ?? (yT + yB) / 2

  const hLeft = xBridge - xStart
  const hRight = xEnd - xBridge
  const vSpan = yB - yT
  const r = Math.min(
    cornerRadius,
    hLeft / 2,
    hRight / 2,
    vSpan / 4,
    Math.max(0, yM - yT) / 2,
    Math.max(0, yB - yM) / 2
  )

  if (r < 0.5 || vSpan < 1) {
    return `M ${xStart} ${yT} H ${xBridge} M ${xStart} ${yB} H ${xBridge} M ${xBridge} ${yT} V ${yB} M ${xBridge} ${yM} H ${xEnd}`
  }

  return [
    `M ${xStart} ${yT} H ${xBridge - r} Q ${xBridge} ${yT} ${xBridge} ${yT + r}`,
    `M ${xStart} ${yB} H ${xBridge - r} Q ${xBridge} ${yB} ${xBridge} ${yB - r}`,
    `M ${xBridge} ${yT + r} V ${yB - r}`,
    `M ${xBridge} ${yM - r} Q ${xBridge} ${yM} ${xBridge + r} ${yM} H ${xEnd}`,
  ].join(" ")
}

/**
 * Connector-Linien zwischen zwei aufeinanderfolgenden Runden (ein Pfad pro Parent-Paar).
 * @returns {Array<{ d: string }>}
 */
export function buildConnectorPaths(
  bracket,
  { columnWidth, rowHeight, slotWidth, offsetX = 0, offsetY = 0 }
) {
  const paths = []
  const { rounds, slotHeight } = bracket

  const cardCenterX = (colIndex) => offsetX + colIndex * columnWidth + columnWidth / 2

  for (let r = 0; r < rounds.length - 1; r++) {
    const current = rounds[r]
    const next = rounds[r + 1]
    const xStart = cardCenterX(r) + slotWidth / 2
    const xEnd = cardCenterX(r + 1) - slotWidth / 2
    const xBridge = (xStart + xEnd) / 2

    for (let parentIndex = 0; parentIndex < next.slots.length; parentIndex++) {
      const child0 = current.slots[parentIndex * 2]
      const child1 = current.slots[parentIndex * 2 + 1]
      const parent = next.slots[parentIndex]
      if (!child0 || !child1 || !parent) continue

      const yTop = offsetY + getSlotCenterRow(child0.rowStart, slotHeight) * rowHeight
      const yBottom = offsetY + getSlotCenterRow(child1.rowStart, slotHeight) * rowHeight
      const yMid = offsetY + getSlotCenterRow(parent.rowStart, slotHeight) * rowHeight

      paths.push({
        d: buildBracketConnectorPath({ xStart, xBridge, xEnd, yTop, yBottom, yMid }),
      })
    }
  }

  return paths
}
