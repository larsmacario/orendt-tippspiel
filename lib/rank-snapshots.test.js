import { describe, it, expect } from "vitest"
import {
  collectCompletedMatchdays,
  pickLastMatchdayBaseline,
} from "./rank-snapshots.js"

describe("pickLastMatchdayBaseline", () => {
  it("uses the previous matchday as baseline for +/-", () => {
    expect(pickLastMatchdayBaseline(["2026-06-12", "2026-06-14", "2026-06-17"])).toEqual({
      lastMatchday: "2026-06-17",
      baselineMatchday: "2026-06-14",
    })
  })

  it("returns no baseline when only one matchday exists", () => {
    expect(pickLastMatchdayBaseline(["2026-06-11"])).toEqual({
      lastMatchday: "2026-06-11",
      baselineMatchday: null,
    })
  })
})

describe("collectCompletedMatchdays", () => {
  it("includes only fully finished matchdays", () => {
    const keys = collectCompletedMatchdays([
      { kickoff_at: "2026-06-14T16:00:00Z", status: "finished" },
      { kickoff_at: "2026-06-14T20:00:00Z", status: "finished" },
      { kickoff_at: "2026-06-15T16:00:00Z", status: "scheduled" },
      { kickoff_at: "2026-06-15T20:00:00Z", status: "finished" },
    ])

    expect(keys).toEqual(["2026-06-14"])
  })
})
