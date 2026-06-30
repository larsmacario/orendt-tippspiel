import { describe, it, expect } from "vitest"
import {
  buildBracketConnectorPath,
  buildConnectorPaths,
  buildKnockoutBracket,
  buildVisibleKnockoutBracket,
  getBracketRowStart,
  getMatchWinner,
  getSlotCenterRow,
  matchesToReactBracketRounds,
  normalizeKnockoutMatch,
  isProjectedKnockoutMatch,
  KO_ROUND_ORDER,
} from "./knockout-bracket.js"

function makeMatch(overrides) {
  return {
    id: overrides.id,
    external_id: overrides.external_id ?? null,
    phase: overrides.phase,
    sort_order: overrides.sort_order ?? 0,
    kickoff_at: overrides.kickoff_at ?? "2026-07-01T16:00:00Z",
    status: overrides.status ?? "scheduled",
    home_score: overrides.home_score ?? null,
    away_score: overrides.away_score ?? null,
    home_pen_score: overrides.home_pen_score ?? null,
    away_pen_score: overrides.away_pen_score ?? null,
    raw_status: overrides.raw_status ?? null,
    home_team: overrides.home_team ?? { name: `Home ${overrides.id}` },
    away_team: overrides.away_team ?? { name: `Away ${overrides.id}` },
    placeholder_home: overrides.placeholder_home ?? null,
    placeholder_away: overrides.placeholder_away ?? null,
  }
}

function makeR32Matches() {
  const ids = {
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
  return Object.entries(ids).map(([no, external_id], i) =>
    makeMatch({
      id: `m${no}`,
      external_id,
      phase: "r32",
      sort_order: i,
      home_team: { name: `Home ${no}` },
      away_team: { name: `Away ${no}` },
    })
  )
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

  it("resolves penalty shootout winner when regulation is tied", () => {
    expect(
      getMatchWinner(
        makeMatch({
          id: "2502846",
          phase: "r32",
          status: "finished",
          home_score: 1,
          away_score: 1,
          home_pen_score: 3,
          away_pen_score: 4,
          raw_status: "PEN",
        })
      )
    ).toBe("away")
  })
})

describe("getBracketRowStart", () => {
  it("spaces first round: card + one gap row + next card", () => {
    expect(getBracketRowStart(0, 0)).toBe(0)
    expect(getBracketRowStart(0, 1)).toBe(3)
    expect(getBracketRowStart(0, 15)).toBe(45)
  })

  it("centers second round between pairs", () => {
    expect(getBracketRowStart(1, 0)).toBe(1.5)
    expect(getBracketRowStart(1, 1)).toBe(7.5)
  })

  it("centers final in the middle", () => {
    expect(getBracketRowStart(4, 0)).toBe(22.5)
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
    expect(r32.slots[1].rowStart).toBe(3)
    expect(r16.slots[0].rowStart).toBe(1.5)
    expect(r16.slots[1].rowStart).toBe(7.5)
    expect(bracket.gridRows).toBe(47)
  })

  it("uses dynamic gridRows based on first round size", () => {
    const matches = Array.from({ length: 8 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(
      Array.from({ length: 8 }, (_, i) =>
        makeMatch({ id: `r16-${i}`, phase: "r16", sort_order: i })
      )
    )
    const bracket = buildKnockoutBracket(matches)
    expect(bracket.gridRows).toBe(23)
  })
})

describe("buildBracketConnectorPath", () => {
  const layout = { xStart: 266, xBridge: 270, xEnd: 292, yTop: 54, yBottom: 270, yMid: 162 }

  it("draws four sharp bracket segments", () => {
    const d = buildBracketConnectorPath(layout)
    expect(d).toContain(`M ${layout.xStart} ${layout.yTop} H ${layout.xBridge}`)
    expect(d).toContain(`M ${layout.xStart} ${layout.yBottom} H ${layout.xBridge}`)
    expect(d).toContain(`M ${layout.xBridge} ${layout.yTop} V ${layout.yBottom}`)
    expect(d).toContain(`M ${layout.xBridge} ${layout.yMid} H ${layout.xEnd}`)
    expect(d).not.toContain(" Q ")
  })

  it("supports optional rounded corners", () => {
    const d = buildBracketConnectorPath({ ...layout, cornerRadius: 4 })
    expect(d).toContain(" Q ")
  })
})

describe("buildConnectorPaths", () => {
  const layout = { columnWidth: 280, rowHeight: 54, slotWidth: 224 }

  function makeR32R16Bracket() {
    const matches = Array.from({ length: 16 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(
      Array.from({ length: 8 }, (_, i) =>
        makeMatch({ id: `r16-${i}`, phase: "r16", sort_order: i })
      )
    )
    return buildKnockoutBracket(matches)
  }

  it("emits one path per parent pair between rounds", () => {
    const bracket = makeR32R16Bracket()
    const paths = buildConnectorPaths(bracket, layout)
    expect(paths).toHaveLength(8)
    expect(paths.every((p) => typeof p.d === "string")).toBe(true)
  })

  it("anchors parent stem at parent slot center", () => {
    const bracket = makeR32R16Bracket()
    const r32 = bracket.rounds.find((r) => r.phase === "r32")
    const r16 = bracket.rounds.find((r) => r.phase === "r16")
    const paths = buildConnectorPaths(bracket, layout)

    const child0Y = getSlotCenterRow(r32.slots[0].rowStart, bracket.slotHeight) * layout.rowHeight
    const child1Y = getSlotCenterRow(r32.slots[1].rowStart, bracket.slotHeight) * layout.rowHeight
    const parentY = getSlotCenterRow(r16.slots[0].rowStart, bracket.slotHeight) * layout.rowHeight

    const xStart = layout.columnWidth / 2 + layout.slotWidth / 2
    expect(paths[0].d).toContain(`M ${xStart} ${child0Y}`)
    expect(paths[0].d).toContain(`M ${xStart} ${child1Y}`)
    expect(paths[0].d).toContain(`${parentY}`)
    expect(parentY).toBe((child0Y + child1Y) / 2)
  })
})

describe("matchesToReactBracketRounds", () => {
  it("maps knockout matches to react-brackets round format", () => {
    const matches = Array.from({ length: 4 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(
      Array.from({ length: 2 }, (_, i) =>
        makeMatch({ id: `r16-${i}`, phase: "r16", sort_order: i })
      )
    )
    const { rounds, final3 } = matchesToReactBracketRounds(matches)
    expect(rounds).toHaveLength(1)
    expect(rounds[0].title).toBe("Runde der letzten 32")
    expect(rounds[0].seeds).toHaveLength(4)
    expect(rounds[0].seeds[0].isPlaceholder).toBeUndefined()
    expect(rounds[0].seeds[0].match.id).toBe("r32-0")
    expect(rounds[0].seeds[0].teams[0].name).toContain("Home")
    expect(final3).toBeNull()
  })

  it("uses placeholder interleaving only with depth >= 2", () => {
    const matches = Array.from({ length: 4 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(
      Array.from({ length: 2 }, (_, i) =>
        makeMatch({ id: `r16-${i}`, phase: "r16", sort_order: i })
      )
    )
    const single = matchesToReactBracketRounds(matches, { depth: 1 })
    expect(single.rounds[0].seeds).toHaveLength(4)
    expect(single.rounds[0].seeds[0].isPlaceholder).toBeUndefined()

    const dual = matchesToReactBracketRounds(matches, { depth: 2 })
    expect(dual.rounds[0].seeds).toHaveLength(8)
    expect(dual.rounds[0].seeds[0].isPlaceholder).toBe(true)
  })

  it("limits achtelfinale to half of r32 matches (valid bracket tree)", () => {
    const matches = Array.from({ length: 8 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(
      Array.from({ length: 8 }, (_, i) =>
        makeMatch({ id: `r16-${i}`, phase: "r16", sort_order: i })
      )
    )
    const { rounds } = matchesToReactBracketRounds(matches, { depth: 2 })
    expect(rounds[0].seeds).toHaveLength(16)
    expect(rounds[1].seeds).toHaveLength(16)
    expect(rounds[1].seeds[2].match.id).toBe("r16-0")
    expect(rounds[1].seeds[6].match.id).toBe("r16-1")
    expect(rounds[1].seeds[10].match.id).toBe("r16-2")
    expect(rounds[1].seeds[14].match.id).toBe("r16-3")
    expect(rounds[1].seeds[0].isPlaceholder).toBe(true)
  })

  it("pads missing achtelfinale slots with noch offen", () => {
    const matches = Array.from({ length: 4 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    ).concat(makeMatch({ id: "r16-0", phase: "r16", sort_order: 0 }))
    const { rounds } = matchesToReactBracketRounds(matches, { depth: 2 })
    expect(rounds[1].seeds).toHaveLength(8)
    expect(rounds[1].seeds[2].match.id).toBe("r16-0")
    expect(rounds[1].seeds[6].match.homeName).toBe("Noch offen")
  })

  it("synthesizes achtelfinale when only r32 exists in db", () => {
    const matches = Array.from({ length: 4 }, (_, i) =>
      makeMatch({ id: `r32-${i}`, phase: "r32", sort_order: i })
    )
    const { rounds } = matchesToReactBracketRounds(matches, { depth: 2 })
    expect(rounds).toHaveLength(2)
    expect(rounds[1].phase).toBe("r16")
    expect(rounds[1].seeds).toHaveLength(8)
    expect(rounds[1].seeds[2].match.homeName).toBe("Noch offen")
  })

  it("does not include viertelfinale when depth is 2", () => {
    const matches = [
      makeMatch({ id: "r32-0", phase: "r32" }),
      makeMatch({ id: "r16-0", phase: "r16" }),
      makeMatch({ id: "qf-0", phase: "qf" }),
    ]
    const { rounds } = matchesToReactBracketRounds(matches, { depth: 2 })
    expect(rounds.map((r) => r.phase)).toEqual(["r32", "r16"])
  })
})

describe("buildVisibleKnockoutBracket", () => {
  it("shows all 16 r32 matches and 8 projected r16 slots", () => {
    const bracket = buildVisibleKnockoutBracket(makeR32Matches(), { depth: 2 })
    expect(bracket.rounds.map((r) => r.phase)).toEqual(["r32", "r16"])
    expect(bracket.rounds[0].slots).toHaveLength(16)
    expect(bracket.rounds[1].slots).toHaveLength(8)
    expect(bracket.rounds[1].slots[0].match.id).toBe("r16-proj-90")
  })

  it("reclassifies mislabeled r16 external ids as r32", () => {
    const matches = makeR32Matches().map((m, i) =>
      i >= 8 ? { ...m, phase: "r16" } : m
    )
    const bracket = buildVisibleKnockoutBracket(matches, { depth: 2 })
    expect(bracket.rounds[0].slots).toHaveLength(16)
  })

  it("fills achtelfinale from r32 winners", () => {
    const matches = makeR32Matches().map((m) => {
      if (m.external_id === "2499618") {
        return {
          ...m,
          status: "finished",
          home_score: 0,
          away_score: 1,
          home_team: { name: "South Africa" },
          away_team: { name: "Canada" },
        }
      }
      return m
    })
    const bracket = buildVisibleKnockoutBracket(matches, { depth: 2 })
    const r16Slot0 = bracket.rounds[1].slots[0].match
    expect(r16Slot0.homeName).toBe("Canada")
    expect(r16Slot0.awayName).toBe("Noch offen")
  })

  it("centers r16 slots between r32 pairs", () => {
    const bracket = buildVisibleKnockoutBracket(makeR32Matches(), { depth: 2 })
    const r32 = bracket.rounds[0]
    const r16 = bracket.rounds[1]
    const child0Y = getSlotCenterRow(r32.slots[0].rowStart, bracket.slotHeight)
    const child1Y = getSlotCenterRow(r32.slots[1].rowStart, bracket.slotHeight)
    const parentY = getSlotCenterRow(r16.slots[0].rowStart, bracket.slotHeight)
    expect(parentY).toBe((child0Y + child1Y) / 2)
  })

  it("shows all knockout rounds through final by default", () => {
    const bracket = buildVisibleKnockoutBracket(makeR32Matches())
    expect(bracket.rounds.map((r) => r.phase)).toEqual(["r32", "r16", "qf", "sf", "final"])
    expect(bracket.rounds[2].slots).toHaveLength(4)
    expect(bracket.rounds[3].slots).toHaveLength(2)
    expect(bracket.rounds[4].slots).toHaveLength(1)
    expect(bracket.rounds[2].slots[0].match.id).toBe("qf-proj-97")
    expect(bracket.rounds[3].slots[0].match.id).toBe("sf-proj-101")
    expect(bracket.rounds[4].slots[0].match.id).toBe("final-proj-104")
  })

  it("propagates winners through qf and sf", () => {
    const matches = makeR32Matches().map((m) => {
      if (m.external_id === "2499618") {
        return {
          ...m,
          status: "finished",
          home_score: 0,
          away_score: 1,
          home_team: { name: "South Africa" },
          away_team: { name: "Canada" },
        }
      }
      if (m.external_id === "2499836") {
        return {
          ...m,
          status: "finished",
          home_score: 2,
          away_score: 0,
          home_team: { name: "Germany" },
          away_team: { name: "Curaçao" },
        }
      }
      return m
    })
    const bracket = buildVisibleKnockoutBracket(matches)
    expect(bracket.rounds[1].slots[0].match.homeName).toBe("Canada")
    expect(bracket.rounds[1].slots[0].match.awayName).toBe("Germany")
    expect(bracket.rounds[2].slots[0].match.homeName).toBe("Noch offen")
    expect(bracket.rounds[2].slots[0].match.awayName).toBe("Noch offen")
  })

  it("propagates paraguay through bracket after germany pen loss", () => {
    const matches = makeR32Matches().map((m) => {
      if (m.external_id === "2502846") {
        return {
          ...m,
          status: "finished",
          home_score: 1,
          away_score: 1,
          home_pen_score: 3,
          away_pen_score: 4,
          raw_status: "PEN",
          home_team: { name: "Germany" },
          away_team: { name: "Paraguay" },
        }
      }
      return m
    })
    const bracket = buildVisibleKnockoutBracket(matches)
    const r16Slot1 = bracket.rounds[1].slots[1].match
    expect(r16Slot1.homeName).toBe("Paraguay")
  })
})
