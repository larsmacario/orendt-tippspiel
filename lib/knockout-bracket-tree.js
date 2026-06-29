/**
 * FIFA WM 2026 – K.o.-Baum (73–88 Letzte 32, 89–96 AF, 97–100 VF, 101–102 HF, 104 Finale, 103 Platz 3).
 * @see https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/knockout-stage-match-schedule-bracket
 */

/** Offizielle Spielnummer → TheSportsDB idEvent */
export const FIFA_KO_MATCH_EXTERNAL_IDS = {
  73: "2499618",
  74: "2502846",
  75: "2499836",
  76: "2499835",
  77: "2502605",
  78: "2502847",
  79: "2503390",
  80: "2503391",
  81: "2499837",
  82: "2503392",
  83: "2503393",
  84: "2503636",
  85: "2503635",
  86: "2502849",
  87: "2503394",
  88: "2502848",
}

export const EXTERNAL_ID_TO_FIFA_MATCH_NO = Object.fromEntries(
  Object.entries(FIFA_KO_MATCH_EXTERNAL_IDS).map(([no, id]) => [id, Number(no)])
)

/** Blatt-Reihenfolge im Bracket (Paare 0+1, 2+3, … → Achtelfinale-Slots). */
export const BRACKET_R32_LEAF_ORDER = [73, 75, 74, 77, 76, 78, 79, 80, 81, 82, 83, 84, 85, 87, 86, 88]

/** Achtelfinale: Sieger welcher Letzte-32-Spiele aufeinandertreffen. */
export const KO_R16_TREE = [
  { r16MatchNo: 90, parents: [73, 75] },
  { r16MatchNo: 89, parents: [74, 77] },
  { r16MatchNo: 91, parents: [76, 78] },
  { r16MatchNo: 92, parents: [79, 80] },
  { r16MatchNo: 94, parents: [81, 82] },
  { r16MatchNo: 93, parents: [83, 84] },
  { r16MatchNo: 96, parents: [85, 87] },
  { r16MatchNo: 95, parents: [86, 88] },
]

/** VF-Spielnummern in Bracket-Slot-Reihenfolge (binäre Paarung aus AF). */
export const KO_QF_MATCH_NOS_BY_SLOT = [97, 99, 98, 100]

export const KO_SF_TREE = [
  { sfMatchNo: 101, parents: [97, 98] },
  { sfMatchNo: 102, parents: [99, 100] },
]

export const KO_FINAL_NODE = { finalMatchNo: 104, parents: [101, 102] }

export function getFifaMatchNumber(match) {
  const externalId = match?.raw?.external_id ?? match?.external_id ?? match?.externalId
  if (externalId) return EXTERNAL_ID_TO_FIFA_MATCH_NO[String(externalId)] ?? null
  return null
}

export function sortMatchesByBracketLeafOrder(matches) {
  const orderIndex = new Map(BRACKET_R32_LEAF_ORDER.map((no, i) => [no, i]))
  return [...matches].sort((a, b) => {
    const na = getFifaMatchNumber(a) ?? 999
    const nb = getFifaMatchNumber(b) ?? 999
    const ia = orderIndex.get(na) ?? na
    const ib = orderIndex.get(nb) ?? nb
    if (ia !== ib) return ia - ib
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}

export function getSlotKnockoutMatchNo(slot) {
  const id = slot?.match?.id ?? slot?.match?.raw?.id
  if (typeof id === "string") {
    const m = id.match(/-proj-(\d+)$/)
    if (m) return Number(m[1])
  }
  return getFifaMatchNumber(slot?.match) ?? null
}

export function isProjectedKnockoutMatch(match) {
  const id = match?.id ?? match?.raw?.id
  return typeof id === "string" && id.includes("-proj-")
}
