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

export function mapPhase(strRound, strGroup) {
  const r = (strRound || strGroup || "").toLowerCase()
  if (r.includes("group") || /^group [a-l]$/i.test(strRound || "")) return "group"
  if (r.includes("round of 32") || r.includes("32")) return "r32"
  if (r.includes("round of 16") || r.includes("8th") || r.includes("last 16")) return "r16"
  if (r.includes("quarter")) return "qf"
  if (r.includes("semi")) return "sf"
  if (r.includes("3rd") || r.includes("third")) return "final3"
  if (r.includes("final")) return "final"
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
