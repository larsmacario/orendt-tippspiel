import { describe, it, expect } from "vitest"
import {
  collectMatchdayKeys,
  filterMatchesByPhasePool,
  buildMatchdayOptions,
  resolveDefaultMatchdayKey,
} from "./matchdays.js"

function match(id, phase, kickoff_at) {
  return { id, phase, kickoff_at }
}

describe("collectMatchdayKeys", () => {
  it("returns unique sorted keys", () => {
    const keys = collectMatchdayKeys([
      match("1", "group", "2026-06-15T16:00:00Z"),
      match("2", "group", "2026-06-14T20:00:00Z"),
      match("3", "group", "2026-06-15T20:00:00Z"),
    ])
    expect(keys).toEqual(["2026-06-14", "2026-06-15"])
  })

  it("ignores matches without kickoff", () => {
    expect(collectMatchdayKeys([match("1", "group", null)])).toEqual([])
  })
})

describe("filterMatchesByPhasePool", () => {
  const matches = [
    match("g1", "group", "2026-06-14T16:00:00Z"),
    match("k1", "qf", "2026-07-04T16:00:00Z"),
  ]

  it("returns all for filter all", () => {
    expect(filterMatchesByPhasePool(matches, "all")).toHaveLength(2)
  })

  it("returns only group matches", () => {
    expect(filterMatchesByPhasePool(matches, "group").map((m) => m.id)).toEqual(["g1"])
  })

  it("returns only ko matches", () => {
    expect(filterMatchesByPhasePool(matches, "ko").map((m) => m.id)).toEqual(["k1"])
  })

  it("does not apply missing filter", () => {
    expect(filterMatchesByPhasePool(matches, "missing")).toHaveLength(2)
  })
})

describe("buildMatchdayOptions", () => {
  it("builds labeled options from phase pool", () => {
    const options = buildMatchdayOptions(
      [match("g1", "group", "2026-06-14T16:00:00Z")],
      "group"
    )
    expect(options).toEqual([{ key: "2026-06-14", label: "Spieltag 14.06." }])
  })
})

describe("resolveDefaultMatchdayKey", () => {
  it("returns today when present in options", () => {
    const today = "2026-06-18"
    const options = [{ key: "2026-06-14", label: "Spieltag 14.06." }, { key: today, label: "Spieltag 18.06." }]
    expect(resolveDefaultMatchdayKey(options, today)).toBe(today)
  })

  it("returns all when today is not in options", () => {
    const options = [{ key: "2026-06-14", label: "Spieltag 14.06." }]
    expect(resolveDefaultMatchdayKey(options, "2026-06-18")).toBe("all")
  })
})
