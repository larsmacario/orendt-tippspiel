"use client"

import { useEffect, useMemo, useState } from "react"
import ScheduleSlide from "./slides/ScheduleSlide"
import ResultsSlide from "./slides/ResultsSlide"
import TimelineSlide from "./slides/TimelineSlide"
import TablesSlide from "./slides/TablesSlide"
import LeaderboardSlide from "./slides/LeaderboardSlide"
import ScreenNewsTicker from "./ScreenNewsTicker"

const SLIDE_DURATION_MS = 22_000
const POLL_INTERVAL_MS = 45_000
const POLL_INTERVAL_LIVE_MS = 30_000

function formatUpdatedAt(iso) {
  if (!iso) return "–"
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  })
}

function buildSlides(data) {
  const slides = [
    { id: "leaderboard", component: LeaderboardSlide, props: { leaderboard: data.leaderboard || {} } },
    { id: "upcoming", component: ScheduleSlide, props: { upcoming: data.upcoming } },
    { id: "tables", component: TablesSlide, props: { tables: data.tables || [] } },
    { id: "recap", component: TimelineSlide, props: { timelines: data.timelines || [] } },
    { id: "recent", component: ResultsSlide, props: { recent: data.recent || [] } },
  ]
  return slides
}

export default function ScreenCarousel() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fading, setFading] = useState(false)

  const slides = useMemo(() => (data ? buildSlides(data) : []), [data])
  const hasLive = (data?.live?.length ?? 0) > 0

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/screen/data")
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Laden fehlgeschlagen")
        }
      }
    }

    load()
    const interval = setInterval(load, hasLive ? POLL_INTERVAL_LIVE_MS : POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [hasLive])

  useEffect(() => {
    if (!slides.length) return
    setSlideIndex((i) => (i >= slides.length ? 0 : i))
  }, [slides.length])

  useEffect(() => {
    if (!slides.length) return

    const tickMs = 100
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += tickMs
      setProgress(Math.min((elapsed / SLIDE_DURATION_MS) * 100, 100))
      if (elapsed >= SLIDE_DURATION_MS) {
        elapsed = 0
        setProgress(0)
        setFading(true)
        setTimeout(() => {
          setSlideIndex((i) => (i + 1) % slides.length)
          setFading(false)
        }, 300)
      }
    }, tickMs)

    return () => clearInterval(timer)
  }, [slides.length, slideIndex])

  const CurrentSlide = slides[slideIndex]?.component

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div>
          <p className="text-3xl font-display font-bold text-status-live">Verbindungsfehler</p>
          <p className="mt-4 text-xl text-orendt-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || !CurrentSlide) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-2xl text-orendt-gray-500 animate-pulse">Lade WM-Daten…</p>
      </div>
    )
  }

  const slideProps = slides[slideIndex].props

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between px-10 py-4 border-b border-orendt-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl md:text-2xl font-display font-bold tracking-wide">
            FIFA WM 2026
          </span>
          <span className="text-orendt-gray-600">|</span>
          <span className="text-sm uppercase tracking-widest text-orendt-gray-500">
            Orendt Studios
          </span>
        </div>
        <div className="text-sm text-orendt-gray-500 tabular-nums">
          Aktualisiert {formatUpdatedAt(data.updatedAt)}
        </div>
      </header>

      <ScreenNewsTicker data={data} />

      <main
        className={`flex-1 min-h-0 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <CurrentSlide {...slideProps} />
      </main>

      <footer className="shrink-0 px-10 py-3 border-t border-orendt-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-8 bg-orendt-accent" : "w-1.5 bg-orendt-gray-700"
                }`}
              />
            ))}
          </div>
          <div className="flex-1 h-1 rounded-full bg-orendt-gray-800 overflow-hidden">
            <div
              className="h-full bg-orendt-accent/60 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
