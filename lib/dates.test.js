import { describe, it, expect, vi, afterEach } from "vitest"
import { isLocked, getTipDeadline, canRevealOtherTips, isMatchStarted } from "./dates.js"

describe("getTipDeadline", () => {
  it("subtracts lock minutes from kickoff", () => {
    const kickoff = "2026-06-11T19:00:00.000Z"
    const deadline = getTipDeadline(kickoff, 30)
    expect(deadline.toISOString()).toBe("2026-06-11T18:30:00.000Z")
  })

  it("defaults to 30 minutes when lock minutes invalid", () => {
    const kickoff = "2026-06-11T19:00:00.000Z"
    const deadline = getTipDeadline(kickoff, -5)
    expect(deadline.toISOString()).toBe("2026-06-11T18:30:00.000Z")
  })

  it("returns null when kickoff missing", () => {
    expect(getTipDeadline(null, 30)).toBeNull()
  })
})

describe("isLocked", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("is locked when now is after deadline", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T18:31:00.000Z"))
    expect(isLocked("2026-06-11T19:00:00.000Z", 30)).toBe(true)
  })

  it("is not locked when now is before deadline", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T18:29:00.000Z"))
    expect(isLocked("2026-06-11T19:00:00.000Z", 30)).toBe(false)
  })

  it("is locked exactly at deadline", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T18:30:00.000Z"))
    expect(isLocked("2026-06-11T19:00:00.000Z", 30)).toBe(true)
  })

  it("is locked when kickoff missing", () => {
    expect(isLocked(null, 30)).toBe(true)
  })
})

describe("isMatchStarted", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("is true when status is live", () => {
    expect(isMatchStarted({ status: "live", kickoff_at: "2099-01-01T12:00:00.000Z" })).toBe(true)
  })

  it("is true when status is finished", () => {
    expect(isMatchStarted({ status: "finished", kickoff_at: "2099-01-01T12:00:00.000Z" })).toBe(true)
  })

  it("is true when kickoff has passed", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T19:01:00.000Z"))
    expect(isMatchStarted({ status: "scheduled", kickoff_at: "2026-06-11T19:00:00.000Z" })).toBe(true)
  })

  it("is false before kickoff", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T18:59:00.000Z"))
    expect(isMatchStarted({ status: "scheduled", kickoff_at: "2026-06-11T19:00:00.000Z" })).toBe(false)
  })
})

describe("canRevealOtherTips", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("reveals when match is live", () => {
    expect(canRevealOtherTips({ status: "live", kickoff_at: "2099-01-01T12:00:00.000Z" })).toBe(true)
  })

  it("reveals when match is finished", () => {
    expect(canRevealOtherTips({ status: "finished", kickoff_at: "2020-01-01T12:00:00.000Z" })).toBe(true)
  })

  it("hides before kickoff", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T18:00:00.000Z"))
    expect(canRevealOtherTips({ status: "scheduled", kickoff_at: "2026-06-11T19:00:00.000Z" })).toBe(false)
  })

  it("reveals after kickoff even if still scheduled", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-11T19:05:00.000Z"))
    expect(canRevealOtherTips({ status: "scheduled", kickoff_at: "2026-06-11T19:00:00.000Z" })).toBe(true)
  })
})
