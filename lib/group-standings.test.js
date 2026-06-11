import { describe, it, expect } from "vitest"
import { computeGroupStandings, hasPlayedGroupMatches, isPlaceholderSportsDbTable } from "./group-standings"

describe("computeGroupStandings", () => {
  it("initialisiert alle WM-Gruppen mit 0 Punkten", () => {
    const tables = computeGroupStandings([])
    expect(tables).toHaveLength(12)
    expect(tables[0].group).toBe("Gruppe A")
    expect(tables[0].rows).toHaveLength(4)
    expect(tables[0].rows.every((r) => r.points === 0)).toBe(true)
  })

  it("berechnet Punkte aus beendeten Gruppenspielen", () => {
    const tables = computeGroupStandings([
      {
        phase: "group",
        status: "finished",
        groupCode: "A",
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        homeScore: 2,
        awayScore: 1,
      },
    ])
    const groupA = tables.find((t) => t.groupCode === "A")
    const mexico = groupA.rows.find((r) => r.team === "Mexico")
    const sa = groupA.rows.find((r) => r.team === "South Africa")
    expect(mexico.points).toBe(3)
    expect(mexico.position).toBe(1)
    expect(sa.points).toBe(0)
  })
})

describe("isPlaceholderSportsDbTable", () => {
  it("erkennt Playoffs/Gesamt-Platzhalter", () => {
    expect(
      isPlaceholderSportsDbTable([
        { strDescription: "Playoffs", intPlayed: "0" },
        { strDescription: "Gesamt", intPlayed: "0" },
      ])
    ).toBe(true)
  })
})

describe("hasPlayedGroupMatches", () => {
  it("ist false ohne Spiele", () => {
    const tables = computeGroupStandings([])
    expect(hasPlayedGroupMatches(tables)).toBe(false)
  })
})
