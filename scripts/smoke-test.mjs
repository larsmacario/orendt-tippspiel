#!/usr/bin/env node
/**
 * Production smoke checks (read-only + API auth boundary).
 * Usage: node scripts/smoke-test.mjs
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (from .env.local)
 */

const PROD_URL = process.env.PROD_URL || "https://tippspiel.orendt.net"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const results = []

function pass(name, detail = "") {
  results.push({ name, ok: true, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`)
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`)
}

async function checkPage(path) {
  const res = await fetch(`${PROD_URL}${path}`)
  if (res.ok) pass(`Page ${path}`, `HTTP ${res.status}`)
  else fail(`Page ${path}`, `HTTP ${res.status}`)
}

async function checkApiUnauthorized() {
  const res = await fetch(`${PROD_URL}/api/admin/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "schedule" }),
  })
  const body = await res.json().catch(() => ({}))
  if (res.status === 401 && body.error === "Unauthorized") {
    pass("API /api/admin/sync ohne Token", "401 Unauthorized")
  } else {
    fail("API /api/admin/sync ohne Token", `HTTP ${res.status}`)
  }
}

async function checkLeaderboard() {
  if (!SUPABASE_URL || !ANON_KEY) {
    fail("Supabase Leaderboard", "NEXT_PUBLIC_* env missing")
    return
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tip_leaderboard?select=display_name,total_points&limit=1`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  )
  if (!res.ok) {
    fail("Supabase Leaderboard", `HTTP ${res.status}`)
    return
  }
  const data = await res.json()
  if (Array.isArray(data) && data.length > 0) {
    pass("Supabase Leaderboard", `${data.length}+ Einträge`)
  } else {
    fail("Supabase Leaderboard", "leer oder ungültig")
  }
}

async function main() {
  console.log(`Smoke-Test gegen ${PROD_URL}\n`)
  await checkPage("/login")
  await checkPage("/spielplan")
  await checkPage("/rangliste")
  await checkApiUnauthorized()
  await checkLeaderboard()

  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} bestanden`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
