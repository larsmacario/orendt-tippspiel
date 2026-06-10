"use client"

import { useState, useCallback, useEffect } from "react"
import { TeamBadge, StatusBadge } from "./TeamBadge"
import {
  formatKickoff,
  isLocked,
  timeUntilDeadline,
  formatDeadline,
} from "@/lib/dates"
import { deletePrediction } from "@/lib/supabase"
import { getMatchGroupCode } from "@/lib/groups"

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function parseTips(homeTip, awayTip) {
  if (homeTip === "" || awayTip === "") return { valid: false }
  const home = parseInt(homeTip, 10)
  const away = parseInt(awayTip, 10)
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    return { valid: false }
  }
  return { valid: true, home, away }
}

export default function PredictionRow({
  match,
  prediction,
  userId,
  onSaved,
  onDirtyChange,
  batchSaving = false,
  lockMinutes = 30,
}) {
  const [homeTip, setHomeTip] = useState(prediction?.home_tip ?? "")
  const [awayTip, setAwayTip] = useState(prediction?.away_tip ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const locked = isLocked(match.kickoff_at, lockMinutes)
  const homeName = match.home_team?.name || match.placeholder_home || "TBD"
  const awayName = match.away_team?.name || match.placeholder_away || "TBD"
  const isLive = match.status === "live"
  const canReset = !locked && match.status !== "finished" && !isLive && (prediction || homeTip !== "" || awayTip !== "")
  const showSavingStatus = saving || batchSaving

  useEffect(() => {
    setHomeTip(prediction?.home_tip ?? "")
    setAwayTip(prediction?.away_tip ?? "")
  }, [prediction?.home_tip, prediction?.away_tip, match.id])

  useEffect(() => {
    if (!onDirtyChange || locked || match.status === "finished" || isLive) return

    const parsed = parseTips(homeTip, awayTip)
    const isDirty =
      parsed.valid &&
      (!prediction ||
        parsed.home !== prediction.home_tip ||
        parsed.away !== prediction.away_tip)

    onDirtyChange(match.id, {
      isDirty,
      homeTip: parsed.valid ? parsed.home : null,
      awayTip: parsed.valid ? parsed.away : null,
      isValid: parsed.valid && isDirty,
    })
  }, [homeTip, awayTip, prediction, match.id, locked, match.status, isLive, onDirtyChange])

  const reset = useCallback(async () => {
    if (locked) return
    setError("")
    setHomeTip("")
    setAwayTip("")
    if (!prediction) return
    setSaving(true)
    const { error: err } = await deletePrediction({ matchId: match.id, userId })
    setSaving(false)
    if (err) {
      setError(err.message)
      setHomeTip(prediction.home_tip ?? "")
      setAwayTip(prediction.away_tip ?? "")
    } else {
      onSaved?.()
    }
  }, [locked, prediction, match.id, userId, onSaved])

  const untilDeadline = timeUntilDeadline(match.kickoff_at, lockMinutes)
  const deadlineLabel = formatDeadline(match.kickoff_at, lockMinutes)
  const groupCode = getMatchGroupCode(match)

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
        isLive
          ? "bg-status-live-bg/40 border-status-live/50"
          : "bg-white border-orendt-gray-200 hover:border-orendt-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
          {formatKickoff(match.kickoff_at)}
        </span>
        <div className="flex items-center gap-2">
          {groupCode && (
            <span className="text-[10px] font-display font-bold text-orendt-gray-400">Gruppe {groupCode}</span>
          )}
          <StatusBadge status={match.status} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamBadge team={match.home_team} size={40} />
          <span className="font-display font-bold text-xs sm:text-sm text-orendt-black leading-tight">{homeName}</span>
        </div>

        <div className="flex flex-col items-center min-w-[7rem]">
          {match.status === "finished" ? (
            <div className="font-display text-2xl sm:text-3xl font-bold text-orendt-black">
              {match.home_score} : {match.away_score}
            </div>
          ) : isLive ? (
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-bold text-status-live">
                {match.home_score ?? "–"} : {match.away_score ?? "–"}
              </div>
              {prediction && (
                <p className="text-[11px] text-orendt-gray-500 mt-1">
                  Dein Tipp: {prediction.home_tip}:{prediction.away_tip}
                </p>
              )}
            </div>
          ) : locked ? (
            <div className="text-center">
              <div className="text-[11px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
                Gesperrt
              </div>
              {prediction && (
                <div className="font-display text-xl sm:text-2xl font-bold text-orendt-black mt-1">
                  {prediction.home_tip} : {prediction.away_tip}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 h-12">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homeTip}
                  onChange={(e) => setHomeTip(e.target.value)}
                  disabled={locked || saving || batchSaving}
                  className="w-12 sm:w-14 h-12 text-center font-display text-xl font-bold bg-orendt-gray-50 border border-orendt-gray-200 rounded-xl focus:border-orendt-black outline-none"
                  aria-label={`Tipp ${homeName}`}
                />
                <span className="text-orendt-gray-300 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayTip}
                  onChange={(e) => setAwayTip(e.target.value)}
                  disabled={locked || saving || batchSaving}
                  className="w-12 sm:w-14 h-12 text-center font-display text-xl font-bold bg-orendt-gray-50 border border-orendt-gray-200 rounded-xl focus:border-orendt-black outline-none"
                  aria-label={`Tipp ${awayName}`}
                />
              </div>
              <div className="h-8 flex items-center justify-center w-full">
                <button
                  type="button"
                  onClick={reset}
                  disabled={saving || batchSaving || !canReset}
                  className={`p-1.5 rounded-lg text-orendt-gray-400 hover:text-orendt-black hover:bg-orendt-gray-50 transition-colors disabled:opacity-50 ${
                    canReset ? "" : "invisible pointer-events-none"
                  }`}
                  aria-label="Tipp zurücksetzen"
                  title="Tipp zurücksetzen"
                  tabIndex={canReset ? 0 : -1}
                >
                  <ResetIcon />
                </button>
              </div>
              <div className="h-4 flex items-center justify-center w-full">
                <span
                  className={`text-[10px] text-orendt-gray-400 ${showSavingStatus ? "" : "invisible"}`}
                  aria-hidden={!showSavingStatus}
                >
                  Speichern…
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <TeamBadge team={match.away_team} size={40} />
          <span className="font-display font-bold text-xs sm:text-sm text-orendt-black leading-tight">{awayName}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-orendt-gray-500">
        <span>
          {match.status === "finished" && prediction?.points != null
            ? `${prediction.points} Punkt${prediction.points !== 1 ? "e" : ""}`
            : isLive
              ? prediction
                ? `Live · Dein Tipp: ${prediction.home_tip}:${prediction.away_tip}`
                : "Live"
              : locked
              ? prediction
                ? `Getippt: ${prediction.home_tip}:${prediction.away_tip} · Tipp-Schluss war ${deadlineLabel}`
                : `Tipp-Schluss war ${deadlineLabel}`
              : prediction
                ? `Getippt: ${prediction.home_tip}:${prediction.away_tip}`
                : untilDeadline
                  ? `Tipp-Schluss in ${untilDeadline}`
                  : "Noch kein Tipp"}
        </span>
        {match.venue && <span className="truncate max-w-[40%]">{match.venue}</span>}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
