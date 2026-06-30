import { describe, it, expect } from "vitest"
import {
  mapStatus,
  mapPhase,
  mapPhaseFromIntRound,
  buildKnockoutPhaseMap,
  parseScore,
  parseEventScores,
  isPenaltyShootoutStatus,
  extractGroupCode,
} from "./sportsdb-mapping.js"

describe("mapStatus", () => {
  it("maps finished statuses", () => {
    expect(mapStatus("FT")).toBe("finished")
    expect(mapStatus("Match Finished")).toBe("finished")
    expect(mapStatus("AET")).toBe("finished")
  })

  it("maps live statuses", () => {
    expect(mapStatus("1H")).toBe("live")
    expect(mapStatus("2H")).toBe("live")
    expect(mapStatus("HT")).toBe("live")
    expect(mapStatus("Live")).toBe("live")
  })

  it("maps scheduled statuses", () => {
    expect(mapStatus("Not Started")).toBe("scheduled")
    expect(mapStatus("NS")).toBe("scheduled")
    expect(mapStatus("")).toBe("scheduled")
    expect(mapStatus(null)).toBe("scheduled")
  })
})

describe("mapPhase", () => {
  it("maps tournament phases from strRound", () => {
    expect(mapPhase("Group A", null)).toBe("group")
    expect(mapPhase("Round of 32", null)).toBe("r32")
    expect(mapPhase("Round of 16", null)).toBe("r16")
    expect(mapPhase("Quarter Final", null)).toBe("qf")
    expect(mapPhase("Semi Final", null)).toBe("sf")
    expect(mapPhase("3rd Place", null)).toBe("final3")
    expect(mapPhase("Final", null)).toBe("final")
  })

  it("maps intRound 1-3 to group", () => {
    expect(mapPhase(null, null, 1)).toBe("group")
    expect(mapPhase(null, null, 2)).toBe("group")
    expect(mapPhase(null, null, 3)).toBe("group")
  })

  it("maps intRound 32 with knockout phase map", () => {
    expect(mapPhase(null, null, 32, "r32")).toBe("r32")
    expect(mapPhase(null, null, 32, "r16")).toBe("r16")
  })

  it("defaults to group when no round info", () => {
    expect(mapPhase(null, null)).toBe("group")
    expect(mapPhase(null, null, 32)).toBe("group")
  })
})

describe("mapPhaseFromIntRound", () => {
  it("maps specific knockout intRound values", () => {
    expect(mapPhaseFromIntRound(16)).toBe("r16")
    expect(mapPhaseFromIntRound(8)).toBe("qf")
    expect(mapPhaseFromIntRound(4)).toBe("sf")
    expect(mapPhaseFromIntRound(2)).toBe("group")
  })
})

describe("buildKnockoutPhaseMap", () => {
  it("marks all intRound=32 events as r32 (Letzte 32)", () => {
    const events = Array.from({ length: 16 }, (_, i) => ({
      idEvent: String(i + 1),
      intRound: "32",
      dateEvent: `2026-07-${String(i + 1).padStart(2, "0")}`,
      strTime: "12:00:00",
    }))
    const map = buildKnockoutPhaseMap(events)
    expect(map["1"]).toBe("r32")
    expect(map["8"]).toBe("r32")
    expect(map["16"]).toBe("r32")
  })
})

describe("parseScore", () => {
  it("parses numeric scores", () => {
    expect(parseScore("2")).toBe(2)
    expect(parseScore(3)).toBe(3)
  })

  it("returns null for empty or invalid values", () => {
    expect(parseScore(null)).toBeNull()
    expect(parseScore("")).toBeNull()
    expect(parseScore("abc")).toBeNull()
  })
})

describe("parseEventScores", () => {
  it("parses regulation scores only for normal FT", () => {
    const scores = parseEventScores({
      intHomeScore: "2",
      intAwayScore: "1",
      strStatus: "FT",
    })
    expect(scores).toEqual({
      homeScore: 2,
      awayScore: 1,
      homePenScore: null,
      awayPenScore: null,
    })
  })

  it("parses penalty shootout from Germany vs Paraguay shape", () => {
    const scores = parseEventScores({
      intHomeScore: "1",
      intAwayScore: "1",
      intHomeScoreExtra: "3",
      intAwayScoreExtra: "4",
      strStatus: "PEN",
    })
    expect(scores).toEqual({
      homeScore: 1,
      awayScore: 1,
      homePenScore: 3,
      awayPenScore: 4,
    })
  })

  it("ignores extra scores without PEN status", () => {
    const scores = parseEventScores({
      intHomeScore: "1",
      intAwayScore: "1",
      intHomeScoreExtra: "3",
      intAwayScoreExtra: "4",
      strStatus: "FT",
    })
    expect(scores.homePenScore).toBeNull()
    expect(scores.awayPenScore).toBeNull()
  })
})

describe("isPenaltyShootoutStatus", () => {
  it("detects PEN status", () => {
    expect(isPenaltyShootoutStatus("PEN")).toBe(true)
    expect(isPenaltyShootoutStatus("Penalties")).toBe(true)
    expect(isPenaltyShootoutStatus("FT")).toBe(false)
  })
})

describe("extractGroupCode", () => {
  it("extracts group letter from strings", () => {
    expect(extractGroupCode("Group E", null)).toBe("E")
    expect(extractGroupCode(null, "Group A")).toBe("A")
  })

  it("returns null when no group found", () => {
    expect(extractGroupCode("Final", "Final")).toBeNull()
  })
})
