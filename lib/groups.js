/** Offizielle WM-2026-Gruppen (Auslosung 05.12.2025) */
export const TEAM_GROUP = {
  Mexico: "A",
  "South Africa": "A",
  "South Korea": "A",
  "Czech Republic": "A",
  Canada: "B",
  Switzerland: "B",
  Qatar: "B",
  "Bosnia-Herzegovina": "B",
  Brazil: "C",
  Morocco: "C",
  Scotland: "C",
  Haiti: "C",
  USA: "D",
  Paraguay: "D",
  Australia: "D",
  Turkey: "D",
  Germany: "E",
  Ecuador: "E",
  "Ivory Coast": "E",
  "Curaçao": "E",
  Netherlands: "F",
  Japan: "F",
  Tunisia: "F",
  Sweden: "F",
  Belgium: "G",
  Iran: "G",
  Egypt: "G",
  "New Zealand": "G",
  Spain: "H",
  Uruguay: "H",
  "Saudi Arabia": "H",
  "Cape Verde": "H",
  France: "I",
  Senegal: "I",
  Norway: "I",
  Iraq: "I",
  Argentina: "J",
  Austria: "J",
  Algeria: "J",
  Jordan: "J",
  Portugal: "K",
  Colombia: "K",
  Uzbekistan: "K",
  "DR Congo": "K",
  England: "L",
  Croatia: "L",
  Panama: "L",
  Ghana: "L",
}

export const GROUP_CODES = "ABCDEFGHIJKL".split("")

export function getMatchGroupCode(match) {
  if (!match) return null
  if (match.group_code) return match.group_code
  if (match.home_team?.group_code) return match.home_team.group_code
  if (match.away_team?.group_code) return match.away_team.group_code
  const home = match.home_team?.name
  const away = match.away_team?.name
  return TEAM_GROUP[home] || TEAM_GROUP[away] || null
}

export function groupSectionKey(match) {
  if (match.phase !== "group") return null
  const code = getMatchGroupCode(match)
  return code ? `Gruppe ${code}` : "Gruppenphase"
}

export function compareGroupSections([a], [b]) {
  const ga = a.match(/^Gruppe ([A-L])$/)
  const gb = b.match(/^Gruppe ([A-L])$/)
  if (ga && gb) return ga[1].localeCompare(gb[1])
  if (ga) return -1
  if (gb) return 1
  return a.localeCompare(b, "de")
}
