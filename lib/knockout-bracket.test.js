import { describe, it, expect } from "vitest"
import {
  buildKnockoutBracket,
  getBracketRowStart,
  getMatchWinner,
  normalizeKnockoutMatch,
  KO_ROUND_ORDER,
} from "./knockout-bracket.js"

function makeMatch(overrides) {
  return {
    id: overrides.id,
    phase: overrides.phase,
    sort_order: overrides.sort_order ?? 0,
    kickoff_at: overrides.kickoff_at ?? "2026-07-01T16:00:00Z",
    status: overrides.status ?? "scheduled",
    home_score: overrides.home_score ?? null,
    away_score: overrides.away_score ?? null,
    home_team: overrides.home_team ?? { name: `Home ${overrides.id}` },
    away_team: overrides.away_team ?? { name: `Away ${overrides.id}` },
    placeholder_home: overrides.placeholder_home ?? null,
    placeholder_away: overrides.placeholder_away ?? null,
  }
}

describe("normalizeKnockoutMatch", () => {
  it("normalizes supabase shape", () => {
    const m = normalizeKnockoutMatch(makeMatch({ id: "1", phase: "qf" }))
    expect(m.phase).toBe("qf")
    expect(m.homeName).toBe("Home 1")
    expect(m.kickoffAt).toBe("2026-07-01T16:00:00Z")
  })

  it("normalizes screen shape", () => {
    const m = normalizeKnockoutMatch({
      id: "2",
      phase: "sf",
      homeTeam: "Germany",
      awayTeam: "France",
      kickoffAt: "2026-07-10T20:00:00Z",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
    })
    expect(m.homeName).toBe("Germany")
    expect(m.awayName).toBe("France")
    expect(m.homeScore).toBe(2)
  })
})

describe("getMatchWinner", () => {
  it("returns home for higher home score", () => {
    expect(
      getMatchWinner(makeMatch({ id: "1", phase: "qf", status: "finished", home_score: 2, away_score: 1 }))
    ).toBe("home")
  })

  it("returns away for higher away score", () => {
    expect(
      getMatchWinner(makeMatch({ id: "1", phase: "qf", status: "finished", home_score: 0, away_score: 1 }))
    ).toBe("away")
  })

  it("returns null for scheduled matches", () => {
    expect(getMatchWinner(makeMatch({ id: "1", phase: "qf" }))).toBeNull()
  })
})

describe("getBracketRowStart", () => {
  it("aligns first round slots on even rows", () => {
    expect(getBracketRowStart(0, 0)).toBe(0)
    expect(getBracketRowStart(0, 1)).toBe(2)
    expect(getBracketRowStart(0, 15)).toBe(30)
  })

  it("centers second round between pairs", () => {
    expect(getBracketRowStart(1, 0)).toBe(1)
    expect(getBracketRowStart(1, 1)).toBe(5)
  })

  it("centers final in the middle", () => {
    expect(getBracketRowStart(4, 0)).toBe(15)
  })
})

describe("buildKnockoutBracket", () => {
  it("filters group matches and orders rounds", () => {
    const matches = [
      makeMatch({ id: "g1", phase: "group" }),
      makeMatch({ id: "f1", phase: "final", sort_order: 99 }),
      makeMatch({ id: "qf1", phase: "qf", sort_order: 1 }),
      makeMatch({ id: "r16-1", phase: "r16", sort_order: 0 }),
    ]

    const bracket = buildKnockoutBracket(matches)
    expect(bracket.rounds.map((r) => r.phase)).toEqual(["r16", "qf", "final"])
    expect(bracket.rounds[0].slots).toHaveLength(1)
    expect(bracket.rounds[0].slots[0].match.id).toBe("r16-1")
  })

  it("sorts slots by sort_order within a round", () => {
    const matches = [
      makeMatch({ id: "a", phase: "qf", sort_order: 2 }),
      makeMatch({ id: "b", phase: "qf", sort_order: 0 }),
      makeMatch({ id: "c", phase: "qf", sort_order: 1 }),
    ]
    const bracket = buildKnockoutBracket(matches)
    const ids = bracket.rounds[0].slots.map((s) => s.match.id)
    expect(ids).toEqual(["b", "c", "a"])
  })

  it("includes final3 separately", () => {
    const matches = [makeMatch({ id: "p3", phase: "final3" })]
    const bracket = buildKnockoutBracket(matches)
    expect(bracket.final3?.match.id).toBe("p3")
    expect(bracket.rounds).toHaveLength(0)
  })

  it("assigns increasing row positions per round depth", () => {
    const matches = KO_ROUND_ORDER.flatMap((phase, roundIdx) =>
      Array.from({ length: 2 ** (4 - roundIdx) }, (_, i) =>
        makeMatch({ id: `${phase}-${i}`, phase, sort_order: i })
      )
    )
    const bracket = buildKnockoutBracket(matches)
    const r32 = bracket.rounds.find((r) => r.phase === "r32")
    const r16 = bracket.rounds.find((r) => r.phase === "r16")
    expect(r32.slots[0].rowStart).toBe(0)
    expect(r32.slots[1].rowStart).toBe(2)
    expect(r16.slots[0].rowStart).toBe(1)
    expect(r16.slots[1].rowStart).toBe(5)
  })
})
