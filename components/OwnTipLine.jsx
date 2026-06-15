"use client"

import { isMatchStarted } from "@/lib/dates"

export default function OwnTipLine({ match, prediction, compact = false }) {
  if (!isMatchStarted(match)) return null

  const isFinished = match.status === "finished"
  const textSize = compact ? "text-[10px]" : "text-[11px]"

  let label
  if (!prediction) {
    label = "Kein Tipp abgegeben"
  } else if (isFinished && prediction.points != null) {
    label = `Dein Tipp: ${prediction.home_tip}:${prediction.away_tip} · ${prediction.points} Punkt${prediction.points !== 1 ? "e" : ""}`
  } else {
    label = `Dein Tipp: ${prediction.home_tip}:${prediction.away_tip}`
  }

  return (
    <p
      className={`mt-3 pt-3 border-t border-orendt-gray-100 text-center text-orendt-gray-500 ${textSize}`}
    >
      {label}
    </p>
  )
}
