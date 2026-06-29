/**
 * Pure mapping helpers mirrored from supabase/functions/_shared/sportsdb.ts
 * for unit testing without Deno/Edge Function runtime.
 */

export function mapStatus(raw) {
  const s = (raw || "").toLowerCase()
  if (s.includes("finished") || s.includes("ft") || s.includes("aet") || s.includes("pen")) return "finished"
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht") || s.includes("et") || s.includes("pen")) return "live"
  if (s.includes("not started") || s.includes("ns") || s.includes("scheduled") || s === "") return "scheduled"
  return "scheduled"
}

export function mapPhaseFromStrRound(strRound, strGroup) {
  const r = (strRound || strGroup || "").toLowerCase()
  if (!r) return null
  if (r.includes("group") || /^group [a-l]$/i.test(strRound || "")) return "group"
  if (r.includes("round of 32") || r.includes("32")) return "r32"
  if (r.includes("round of 16") || r.includes("8th") || r.includes("last 16")) return "r16"
  if (r.includes("quarter")) return "qf"
  if (r.includes("semi")) return "sf"
  if (r.includes("3rd") || r.includes("third")) return "final3"
  if (r.includes("final")) return "final"
  return null
}

export function mapPhaseFromIntRound(intRound) {
  if (intRound === null || intRound === undefined || intRound === "") return null
  const n = parseInt(String(intRound), 10)
  if (isNaN(n)) return null
  if (n >= 1 && n <= 3) return "group"
  if (n === 16) return "r16"
  if (n === 8) return "qf"
  if (n === 4) return "sf"
  return null
}

function parseKickoffForMap(dateEvent, strTime) {
  const time = strTime && strTime !== "00:00:00" ? strTime : "12:00:00"
  return new Date(`${dateEvent}T${time}Z`).toISOString()
}

/** intRound=32: alle 16 K.o.-Spiele der Letzten 32 (TheSportsDB hat kein separates intRound für AF). */
export function buildKnockoutPhaseMap(events) {
  const map = {}
  for (const e of events || []) {
    if (String(e.intRound) !== "32") continue
    const externalId = String(e.idEvent || e.id)
    map[externalId] = "r32"
  }
  return map
}

export function mapPhase(strRound, strGroup, intRound, knockoutPhase) {
  const fromStr = mapPhaseFromStrRound(strRound, strGroup)
  if (fromStr) return fromStr

  const fromInt = mapPhaseFromIntRound(intRound)
  if (fromInt) return fromInt

  if (intRound != null && String(intRound) === "32" && knockoutPhase) {
    return knockoutPhase
  }

  return "group"
}

export function parseScore(value) {
  if (value === null || value === undefined || value === "") return null
  const n = parseInt(String(value), 10)
  return isNaN(n) ? null : n
}

export function extractGroupCode(strGroup, strRound) {
  const source = strGroup || strRound || ""
  const match = source.match(/group\s*([A-L])/i) || source.match(/^([A-L])$/i)
  return match ? match[1].toUpperCase() : null
}
