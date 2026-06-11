"use client"

import { useEffect, useMemo, useState } from "react"
import { formatKickoff } from "@/lib/dates"

const TICKER_ROTATE_MS = 9_000

function LiveDot() {
  return (
    <span className="flex items-center gap-2 shrink-0 text-status-live text-xs font-display font-bold uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-status-live opacity-40 animate-live-pulse" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-live" />
      </span>
      Live
    </span>
  )
}

function formatEvent(entry) {
  const player = entry.player
    ? ` ${entry.teamFlagEmoji || ""} ${entry.player}`.replace(/\s+/g, " ").trim()
    : ""
  return `${entry.minute}' ${entry.label}${player ? ` ${player}` : ""}`
}

function EventsTicker({ timeline }) {
  const { event, events, reason } = timeline
  const isLive = reason === "live"
  const line = events
    .slice(-6)
    .map(formatEvent)
    .join("   ·   ")

  return (
    <div className="flex items-center gap-4 min-w-0 flex-1">
      {isLive && <LiveDot />}
      <span className="shrink-0 text-sm font-display font-bold tabular-nums text-orendt-accent">
        {event.homeTeam} {event.homeScore ?? "–"}:{event.awayScore ?? "–"} {event.awayTeam}
      </span>
      {line && (
        <>
          <span className="text-orendt-gray-700 shrink-0">|</span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm text-orendt-gray-300 truncate md:whitespace-nowrap animate-ticker-marquee md:animate-none">
              {line}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function LiveScoresTicker({ live }) {
  const line = live
    .map((m) => `${m.homeTeam} ${m.homeScore ?? "–"}:${m.awayScore ?? "–"} ${m.awayTeam}${m.progress ? ` (${m.progress})` : ""}`)
    .join("   ·   ")

  return (
    <div className="flex items-center gap-4 min-w-0 flex-1">
      <LiveDot />
      <p className="text-sm font-medium text-orendt-gray-200 truncate">{line}</p>
    </div>
  )
}

function NextMatchTicker({ match }) {
  return (
    <p className="text-sm text-orendt-gray-500 truncate">
      <span className="uppercase tracking-widest text-orendt-gray-600 mr-3">Nächstes Spiel</span>
      <span className="text-orendt-gray-300 font-medium">
        {match.homeTeam} vs {match.awayTeam}
      </span>
      <span className="mx-3 text-orendt-gray-600">·</span>
      <span className="tabular-nums text-orendt-accent">{formatKickoff(match.kickoffAt)}</span>
    </p>
  )
}

function resolveTickerMode(data) {
  if (data.timelines?.length) return "events"
  if (data.live?.length) return "live-scores"
  if (data.upcoming?.[0]) return "next"
  return "hidden"
}

export default function ScreenNewsTicker({ data }) {
  const mode = useMemo(() => (data ? resolveTickerMode(data) : "hidden"), [data])
  const timelines = data?.timelines || []
  const [matchIndex, setMatchIndex] = useState(0)

  useEffect(() => {
    setMatchIndex(0)
  }, [timelines.length, mode])

  useEffect(() => {
    if (mode !== "events" || timelines.length <= 1) return
    const timer = setInterval(() => {
      setMatchIndex((i) => (i + 1) % timelines.length)
    }, TICKER_ROTATE_MS)
    return () => clearInterval(timer)
  }, [mode, timelines.length])

  if (mode === "hidden" || !data) return null

  const isLiveTicker = mode === "events" ? timelines[matchIndex]?.reason === "live" : mode === "live-scores"

  return (
    <div
      className={`shrink-0 border-b px-10 py-2.5 ${
        isLiveTicker
          ? "border-status-live/20 bg-status-live/5"
          : "border-orendt-gray-800 bg-orendt-dark/50"
      }`}
    >
      <div className="flex items-center min-h-[1.5rem]">
        {mode === "events" && timelines[matchIndex] && (
          <EventsTicker timeline={timelines[matchIndex]} />
        )}
        {mode === "live-scores" && <LiveScoresTicker live={data.live} />}
        {mode === "next" && <NextMatchTicker match={data.upcoming[0]} />}
        {mode === "events" && timelines.length > 1 && (
          <span className="shrink-0 ml-4 text-xs text-orendt-gray-600 tabular-nums">
            {matchIndex + 1}/{timelines.length}
          </span>
        )}
      </div>
    </div>
  )
}
