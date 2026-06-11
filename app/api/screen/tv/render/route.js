import { loadScreenData } from "@/lib/screen-data"
import { buildScreenTvPayload } from "@/lib/screen-tv-html"

const CACHE_TTL_MS = 45_000
let cache = { payload: null, expiresAt: 0 }

export async function GET() {
  try {
    const now = Date.now()
    if (cache.payload && now < cache.expiresAt) {
      return Response.json(cache.payload, {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
        },
      })
    }

    const data = await loadScreenData()
    const payload = buildScreenTvPayload(data)
    cache = { payload, expiresAt: now + CACHE_TTL_MS }

    return Response.json(payload, {
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
