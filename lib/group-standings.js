import { TEAM_GROUP, GROUP_CODES, getTeamFlagEmoji } from "./groups"

function emptyRow(team, badge = null) {
  return {
    team,
    badge,
    flagEmoji: getTeamFlagEmoji(team),
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }
}

function compareRows(a, b) {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return a.team.localeCompare(b.team, "de")
}

/** Gruppentabellen aus beendeten Gruppenspielen berechnen (WM 2026 A–L). */
export function computeGroupStandings(matches, teamBadges = {}) {
  const groups = {}

  for (const code of GROUP_CODES) {
    groups[code] = {}
  }

  for (const [team, code] of Object.entries(TEAM_GROUP)) {
    if (groups[code]) {
      groups[code][team] = emptyRow(team, teamBadges[team] || null)
    }
  }

  for (const match of matches) {
    if (match.phase !== "group" || match.status !== "finished") continue
    if (match.homeScore == null || match.awayScore == null) continue

    const groupCode = match.groupCode
    if (!groupCode || !groups[groupCode]) continue

    const home = groups[groupCode][match.homeTeam]
    const away = groups[groupCode][match.awayTeam]
    if (!home || !away) continue

    const hs = match.homeScore
    const as = match.awayScore

    for (const row of [home, away]) {
      row.played += 1
    }
    home.goalsFor += hs
    home.goalsAgainst += as
    away.goalsFor += as
    away.goalsAgainst += hs

    if (hs > as) {
      home.wins += 1
      home.points += 3
      away.losses += 1
    } else if (hs < as) {
      away.wins += 1
      away.points += 3
      home.losses += 1
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
    }

    home.goalDiff = home.goalsFor - home.goalsAgainst
    away.goalDiff = away.goalsFor - away.goalsAgainst

    if (match.homeBadge && !home.badge) home.badge = match.homeBadge
    if (match.awayBadge && !away.badge) away.badge = match.awayBadge
  }

  return GROUP_CODES.filter((code) => groups[code] && Object.keys(groups[code]).length > 0).map((code) => {
    const rows = Object.values(groups[code])
      .sort(compareRows)
      .map((row, i) => ({ ...row, position: i + 1 }))
    return { group: `Gruppe ${code}`, groupCode: code, rows }
  })
}

export function hasPlayedGroupMatches(tables) {
  return tables.some((t) => t.rows.some((r) => r.played > 0))
}

/** SportsDB lookuptable liefert für WM 2026 oft nur Platzhalter – nicht anzeigen. */
export function isPlaceholderSportsDbTable(rawTable) {
  if (!Array.isArray(rawTable) || !rawTable.length) return true
  const descriptions = new Set(rawTable.map((r) => (r.strDescription || r.strGroup || "").toLowerCase()))
  const junk = ["playoffs", "gesamt", "overall", "qualification"]
  if ([...descriptions].some((d) => junk.some((j) => d.includes(j)))) return true
  const allZero = rawTable.every((r) => parseInt(r.intPlayed, 10) === 0)
  const noRealGroups = !rawTable.some((r) => /group\s*[a-l]/i.test(r.strGroup || r.strDescription || ""))
  return allZero && noRealGroups
}
