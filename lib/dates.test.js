import { describe, it, expect, vi, afterEach } from "vitest"
import { isLocked, getTipDeadline } from "./dates.js"

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
