import { describe, it, expect } from "vitest"
import { calcPoints, getTendencyLabel } from "./scoring.js"

describe("calcPoints", () => {
  it("returns null when any value is missing", () => {
    expect(calcPoints(null, 1, 2, 1)).toBeNull()
    expect(calcPoints(2, null, 2, 1)).toBeNull()
    expect(calcPoints(2, 1, null, 1)).toBeNull()
    expect(calcPoints(2, 1, 2, null)).toBeNull()
  })

  it("awards 4 points for exact result", () => {
    expect(calcPoints(2, 1, 2, 1)).toBe(4)
    expect(calcPoints(0, 0, 0, 0)).toBe(4)
  })

  it("awards 3 points for correct goal difference", () => {
    expect(calcPoints(3, 1, 2, 0)).toBe(3)
    expect(calcPoints(0, 2, 1, 3)).toBe(3)
  })

  it("awards 1 point for draw tendency without goal diff points", () => {
    expect(calcPoints(1, 1, 2, 2)).toBe(1)
    expect(calcPoints(0, 0, 1, 1)).toBe(1)
  })

  it("awards 2 points for correct tendency only", () => {
    expect(calcPoints(3, 0, 2, 1)).toBe(2)
    expect(calcPoints(2, 0, 1, 0)).toBe(2)
    expect(calcPoints(0, 3, 1, 2)).toBe(2)
  })

  it("awards 0 points for wrong tendency", () => {
    expect(calcPoints(0, 2, 3, 0)).toBe(0)
    expect(calcPoints(2, 2, 1, 0)).toBe(0)
  })

  it("matches Kicker reference matrix (DB parity)", () => {
    const matrix = [
      { tip: [2, 1], result: [2, 1], expected: 4 },
      { tip: [3, 0], result: [2, 1], expected: 2 },
      { tip: [1, 1], result: [2, 2], expected: 1 },
      { tip: [0, 2], result: [3, 0], expected: 0 },
      { tip: [2, 0], result: [1, 0], expected: 2 },
    ]
    for (const { tip, result, expected } of matrix) {
      expect(calcPoints(tip[0], tip[1], result[0], result[1])).toBe(expected)
    }
  })
})

describe("getTendencyLabel", () => {
  it("labels home win, away win, and draw", () => {
    expect(getTendencyLabel(2, 0)).toBe("Heimsieg")
    expect(getTendencyLabel(0, 2)).toBe("Auswärtssieg")
    expect(getTendencyLabel(1, 1)).toBe("Unentschieden")
  })
})
