import { fetchScreenData } from "@/lib/sportsdb-display"

const CACHE_TTL_MS = 45_000
let cache = { data: null, expiresAt: 0 }

export async function GET() {
  try {
    const now = Date.now()
    if (cache.data && now < cache.expiresAt) {
      return Response.json(cache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
        },
      })
    }

    const data = await fetchScreenData()
    cache = { data, expiresAt: now + CACHE_TTL_MS }

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler"
    const status = message.includes("SPORTSDB_API_KEY") ? 503 : 502
    return Response.json({ error: message }, { status })
  }
}
