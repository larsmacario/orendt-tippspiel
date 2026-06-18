import { describe, it, expect } from "vitest"
import {
  buildKicktippRows,
  formatRankDelta,
  formatSnapshotMatchdayLabel,
  formatRankDeltaCaption,
  formatTeamCode,
  formatWindowAverage,
  SCREEN_TOP_LIMIT,
} from "./leaderboard-matrix.js"

describe("formatTeamCode", () => {
  it("uses team code when present", () => {
    expect(formatTeamCode({ code: "mex" }, null)).toBe("MEX")
  })

  it("falls back to name prefix", () => {
    expect(formatTeamCode({ name: "Deutschland" }, null)).toBe("DEU")
  })
})

describe("formatWindowAverage", () => {
  it("formats german decimal average", () => {
    expect(formatWindowAverage(6, 6)).toBe("1,00")
  })

  it("returns dash when no tips", () => {
    expect(formatWindowAverage(0, 0)).toBe("–")
  })
})

describe("formatRankDelta", () => {
  it("shows plus for improvement", () => {
    expect(formatRankDelta(2)).toBe("+2")
  })

  it("shows minus for drop", () => {
    expect(formatRankDelta(-1)).toBe("-1")
  })

  it("is empty for no change or null", () => {
    expect(formatRankDelta(0)).toBe("")
    expect(formatRankDelta(null)).toBe("")
  })
})

describe("snapshot matchday labels", () => {
  it("formats german spieltag label", () => {
    expect(formatSnapshotMatchdayLabel("2026-06-14")).toBe("Spieltag 14.06.")
  })

  it("builds rank delta caption", () => {
    expect(formatRankDeltaCaption("2026-06-14")).toBe("+/- Spieltag 14.06.")
    expect(formatSnapshotMatchdayLabel("2026-06-14")).toBe("Spieltag 14.06.")
  })
})

describe("buildKicktippRows", () => {
  const leaderboard = [
    {
      user_id: "u1",
      display_name: "Alice",
      total_points: 10,
      champion_bonus: 0,
      exact_hits: 1,
      diff_hits: 0,
    },
    {
      user_id: "u2",
      display_name: "Bob",
      total_points: 6,
      champion_bonus: 25,
      exact_hits: 0,
      diff_hits: 1,
    },
  ]

  const matches = [
    { id: "m1", home_score: 2, away_score: 0 },
    { id: "m2", home_score: 1, away_score: 1 },
  ]

  const predictions = [
    { user_id: "u1", match_id: "m1", home_tip: 2, away_tip: 1, points: 2 },
    { user_id: "u1", match_id: "m2", home_tip: 1, away_tip: 0, points: 0 },
    { user_id: "u2", match_id: "m1", home_tip: 2, away_tip: 0, points: 4 },
  ]

  const snapshots = [
    { user_id: "u1", rank: 2, total_points: 4 },
    { user_id: "u2", rank: 1, total_points: 4 },
  ]

  it("builds ranked rows with match cells and window stats", () => {
    const rows = buildKicktippRows({ leaderboard, matches, predictions, snapshots })

    expect(rows[0].rank).toBe(1)
    expect(rows[0].userId).toBe("u1")
    expect(rows[0].windowPoints).toBe(2)
    expect(rows[0].windowAverage).toBe("1,00")
    expect(rows[0].cells[0].points).toBe(2)
    expect(rows[0].cells[1].homeTip).toBe(1)
  })

  it("computes rank delta from latest snapshot", () => {
    const rows = buildKicktippRows({ leaderboard, matches, predictions, snapshots })
    expect(rows[0].rankDelta).toBe(1)
    expect(rows[0].rankDeltaLabel).toBe("+1")
    expect(rows[1].rankDelta).toBe(-1)
    expect(rows[1].rankDeltaLabel).toBe("-1")
  })

  it("maps champion bonus and total points", () => {
    const rows = buildKicktippRows({ leaderboard, matches, predictions, snapshots })
    expect(rows[1].championBonus).toBe(25)
    expect(rows[1].totalPoints).toBe(6)
  })

  it("supports top-N slice for screen leaderboard", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      user_id: `u${i}`,
      display_name: `Player ${i}`,
      total_points: 15 - i,
      champion_bonus: 0,
    }))
    const rows = buildKicktippRows({ leaderboard: many, matches: [], predictions: [] })
    const top = rows.slice(0, SCREEN_TOP_LIMIT)
    expect(top).toHaveLength(15)
    expect(top[0].rank).toBe(1)
    expect(top[14].rank).toBe(15)
  })
})
