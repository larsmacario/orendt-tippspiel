"use client"

import { useState, useEffect } from "react"
import { TeamBadge } from "../TeamBadge"
import { ScreenBadge } from "../screen/ScreenBadge"
import { formatKickoff, isLocked } from "@/lib/dates"
import { getMatchWinner } from "@/lib/knockout-bracket"
import { getTeamFlagEmoji } from "@/lib/groups"

function parseTips(homeTip, awayTip) {
  if (homeTip === "" || awayTip === "") return { valid: false }
  const home = parseInt(homeTip, 10)
  const away = parseInt(awayTip, 10)
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    return { valid: false }
  }
  return { valid: true, home, away }
}

const VARIANTS = {
  light: {
    slot: "bg-white border-orendt-gray-200",
    slotLive: "bg-status-live-bg/30 border-status-live/50",
    slotMissing: "border-orendt-accent/60 ring-1 ring-orendt-accent/30",
    row: "border-orendt-gray-100",
    rowWinner: "bg-orendt-accent/15 font-bold",
    rowDefault: "bg-transparent",
    name: "text-orendt-black",
    nameMuted: "text-orendt-gray-400",
    score: "text-orendt-black tabular-nums",
    scoreLive: "text-status-live tabular-nums",
    meta: "text-orendt-gray-400",
    input: "bg-orendt-gray-50 border-orendt-gray-200 text-orendt-black focus:border-orendt-black",
  },
  dark: {
    slot: "bg-[#161616] border-orendt-gray-800",
    slotLive: "bg-status-live/10 border-status-live/40",
    slotMissing: "border-orendt-accent/50 ring-1 ring-orendt-accent/25",
    row: "border-orendt-gray-800",
    rowWinner: "bg-orendt-accent/15 font-bold",
    rowDefault: "bg-transparent",
    name: "text-white",
    nameMuted: "text-orendt-gray-500",
    score: "text-white tabular-nums",
    scoreLive: "text-status-live tabular-nums",
    meta: "text-orendt-gray-500",
    input: "bg-orendt-gray-900 border-orendt-gray-700 text-white focus:border-orendt-accent",
  },
}

const SIZES = {
  default: { badge: 18, name: "text-[11px]", score: "text-xs", input: "w-7 h-7 text-sm", rowH: "h-7", slotW: "w-[11.5rem]" },
  screen: { badge: 22, name: "text-sm", score: "text-base", input: "w-8 h-8 text-base", rowH: "h-9", slotW: "w-[14rem]" },
}

function TeamRow({
  name,
  team,
  badgeUrl,
  flagEmoji,
  score,
  isWinner,
  isLive,
  editable,
  tipValue,
  onTipChange,
  disabled,
  variant,
  size,
  side,
}) {
  const v = VARIANTS[variant]
  const s = SIZES[size]

  return (
    <div
      className={`flex items-center gap-1.5 px-2 ${s.rowH} border-b last:border-b-0 ${v.row} ${
        isWinner ? v.rowWinner : v.rowDefault
      }`}
    >
      {variant === "dark" ? (
        <ScreenBadge badgeUrl={badgeUrl} teamName={name} flagEmoji={flagEmoji} size={s.badge} />
      ) : (
        <TeamBadge team={team} size={s.badge} />
      )}
      <span
        className={`flex-1 truncate font-display leading-tight ${s.name} ${
          isWinner ? v.name : name === "TBD" ? v.nameMuted : v.name
        }`}
        title={name}
      >
        {name}
      </span>
      {editable ? (
        <input
          type="number"
          min="0"
          max="20"
          value={tipValue}
          onChange={(e) => onTipChange(e.target.value)}
          disabled={disabled}
          className={`${s.input} text-center font-display font-bold rounded-md border outline-none ${v.input}`}
          aria-label={`Tipp ${side} ${name}`}
        />
      ) : (
        <span className={`font-display font-bold shrink-0 ${s.score} ${isLive ? v.scoreLive : v.score}`}>
          {score ?? "–"}
        </span>
      )}
    </div>
  )
}

export default function BracketMatchSlot({
  slot,
  prediction,
  variant = "light",
  size = "default",
  editable = false,
  highlightMissing = false,
  lockMinutes = 30,
  batchSaving = false,
  onDirtyChange,
}) {
  const match = slot.match.raw || slot.match
  const normalized = slot.match
  const v = VARIANTS[variant]
  const s = SIZES[size]

  const [homeTip, setHomeTip] = useState(prediction?.home_tip ?? "")
  const [awayTip, setAwayTip] = useState(prediction?.away_tip ?? "")

  const locked = isLocked(normalized.kickoffAt, lockMinutes)
  const isLive = normalized.status === "live"
  const isFinished = normalized.status === "finished"
  const winner = getMatchWinner(match)
  const canEdit = editable && !locked && !isFinished && !isLive

  const missingTip = highlightMissing && !prediction && !locked

  useEffect(() => {
    setHomeTip(prediction?.home_tip ?? "")
    setAwayTip(prediction?.away_tip ?? "")
  }, [prediction?.home_tip, prediction?.away_tip, normalized.id])

  useEffect(() => {
    if (!onDirtyChange || !canEdit) return
    const parsed = parseTips(homeTip, awayTip)
    const isDirty =
      parsed.valid &&
      (!prediction || parsed.home !== prediction.home_tip || parsed.away !== prediction.away_tip)
    onDirtyChange(normalized.id, {
      isDirty,
      homeTip: parsed.valid ? parsed.home : null,
      awayTip: parsed.valid ? parsed.away : null,
      isValid: parsed.valid && isDirty,
    })
  }, [homeTip, awayTip, prediction, normalized.id, canEdit, onDirtyChange])

  const homeScore = isFinished || isLive ? normalized.homeScore : canEdit ? null : prediction?.home_tip
  const awayScore = isFinished || isLive ? normalized.awayScore : canEdit ? null : prediction?.away_tip

  const homeFlag = normalized.homeFlagEmoji || getTeamFlagEmoji(normalized.homeName)
  const awayFlag = normalized.awayFlagEmoji || getTeamFlagEmoji(normalized.awayName)

  return (
    <div
      className={`rounded-lg border overflow-hidden ${s.slotW} ${missingTip ? v.slotMissing : isLive ? v.slotLive : v.slot}`}
      title={normalized.kickoffAt ? formatKickoff(normalized.kickoffAt) : undefined}
    >
      <TeamRow
        name={normalized.homeName}
        team={normalized.homeTeam}
        badgeUrl={normalized.homeBadge}
        flagEmoji={homeFlag}
        score={homeScore}
        isWinner={winner === "home"}
        isLive={isLive}
        editable={canEdit}
        tipValue={homeTip}
        onTipChange={setHomeTip}
        disabled={!canEdit || batchSaving}
        variant={variant}
        size={size}
        side="home"
      />
      <TeamRow
        name={normalized.awayName}
        team={normalized.awayTeam}
        badgeUrl={normalized.awayBadge}
        flagEmoji={awayFlag}
        score={awayScore}
        isWinner={winner === "away"}
        isLive={isLive}
        editable={canEdit}
        tipValue={awayTip}
        onTipChange={setAwayTip}
        disabled={!canEdit || batchSaving}
        variant={variant}
        size={size}
        side="away"
      />
      {isLive && (
        <div className={`px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-wider ${v.meta}`}>
          Live
        </div>
      )}
    </div>
  )
}
