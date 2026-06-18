export function getToday() {
  return new Date().toISOString().split("T")[0]
}

export function formatKickoff(isoString) {
  if (!isoString) return "–"
  const date = new Date(isoString)
  return date.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  })
}

export function formatDate(isoString) {
  if (!isoString) return "–"
  return new Date(isoString).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  })
}

export function getMatchdayKey(kickoffAt) {
  if (!kickoffAt) return null
  return new Date(kickoffAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })
}

export function getBerlinTodayKey(date = new Date()) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })
}

function berlinWallTimeToDate(dayKey, hour, minute, second, ms) {
  const [y, mo, d] = dayKey.split("-").map(Number)
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  let t = Date.UTC(y, mo - 1, d, hour, minute, second, ms)
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(t))
    const py = Number(parts.find((p) => p.type === "year")?.value)
    const pmo = Number(parts.find((p) => p.type === "month")?.value)
    const pd = Number(parts.find((p) => p.type === "day")?.value)
    const ph = Number(parts.find((p) => p.type === "hour")?.value)
    const pmi = Number(parts.find((p) => p.type === "minute")?.value)
    const ps = Number(parts.find((p) => p.type === "second")?.value)
    const desired = Date.UTC(y, mo - 1, d, hour, minute, second, ms)
    const actual = Date.UTC(py, pmo - 1, pd, ph, pmi, ps, 0)
    t += desired - actual
  }
  return new Date(t)
}

export function getBerlinDayBounds(date = new Date()) {
  const dayKey = getBerlinTodayKey(date)
  const start = berlinWallTimeToDate(dayKey, 0, 0, 0, 0)
  const end = berlinWallTimeToDate(dayKey, 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString(), dayKey }
}

const STATUS_SORT_ORDER = { live: 0, scheduled: 1, finished: 2 }

export function sortMatchesForToday(matches) {
  return [...matches].sort((a, b) => {
    const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 1) - (STATUS_SORT_ORDER[b.status] ?? 1)
    if (statusDiff !== 0) return statusDiff
    return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  })
}

export function formatRawStatus(raw) {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("ht") || s.includes("half")) return "Halbzeit"
  if (s.includes("1h") || s.includes("1st")) return "1. HZ"
  if (s.includes("2h") || s.includes("2nd")) return "2. HZ"
  if (s.includes("et")) return "Verlängerung"
  if (s.includes("pen")) return "Elfmeter"
  return raw
}

export function shouldPollTodayMatches(matches) {
  const now = Date.now()
  const soonMs = 15 * 60 * 1000
  return matches.some((m) => {
    if (m.status === "live") return true
    if (m.status !== "scheduled") return false
    const kickoff = new Date(m.kickoff_at).getTime()
    return kickoff > now && kickoff - now <= soonMs
  })
}

export function getTipDeadline(kickoffAt, lockMinutes = 30) {
  if (!kickoffAt) return null
  const minutes = Number.isFinite(lockMinutes) && lockMinutes >= 0 ? lockMinutes : 30
  return new Date(new Date(kickoffAt).getTime() - minutes * 60 * 1000)
}

export function isLocked(kickoffAt, lockMinutes = 30) {
  const deadline = getTipDeadline(kickoffAt, lockMinutes)
  if (!deadline) return true
  return deadline <= new Date()
}

export function formatDeadline(kickoffAt, lockMinutes = 30) {
  const deadline = getTipDeadline(kickoffAt, lockMinutes)
  if (!deadline) return "–"
  return deadline.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  })
}

function formatDuration(diffMs) {
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days} Tag${days > 1 ? "e" : ""}`
  }
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins} min`
}

export function timeUntilDeadline(kickoffAt, lockMinutes = 30) {
  const deadline = getTipDeadline(kickoffAt, lockMinutes)
  if (!deadline) return null
  return formatDuration(deadline.getTime() - Date.now())
}

export function timeUntilKickoff(kickoffAt) {
  if (!kickoffAt) return null
  return formatDuration(new Date(kickoffAt).getTime() - Date.now())
}

export function isMatchStarted(match) {
  if (!match) return false
  if (match.status === "live" || match.status === "finished") return true
  if (!match.kickoff_at) return false
  return new Date(match.kickoff_at).getTime() <= Date.now()
}

export function canRevealOtherTips(match) {
  return isMatchStarted(match)
}

export const PHASE_LABELS = {
  group: "Gruppenphase",
  r32: "Letzte 32",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  final3: "Spiel um Platz 3",
  final: "Finale",
}
