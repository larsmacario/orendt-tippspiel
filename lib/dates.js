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

export const PHASE_LABELS = {
  group: "Gruppenphase",
  r32: "Achtelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  final3: "Spiel um Platz 3",
  final: "Finale",
}
