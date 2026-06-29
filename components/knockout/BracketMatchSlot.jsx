"use client"

import { useState, useEffect } from "react"
import { TeamBadge } from "../TeamBadge"
import { ScreenBadge } from "../screen/ScreenBadge"
import { formatKickoffBracket, isLocked } from "@/lib/dates"
import { getMatchWinner, isProjectedKnockoutMatch } from "@/lib/knockout-bracket"
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
    slotLive: "bg-status-live-bg/25 border-status-live/45",
    slotMissing: "border-orendt-accent/60 ring-1 ring-orendt-accent/30",
    slotLocked: "bg-orendt-gray-50 border-orendt-gray-200",
    header: "border-b border-orendt-gray-100 bg-orendt-gray-50/60",
    row: "border-b border-orendt-gray-100 last:border-b-0",
    rowWinner: "bg-orendt-accent/12 font-semibold",
    rowDefault: "bg-transparent",
    name: "text-orendt-black font-medium",
    nameMuted: "text-orendt-gray-400",
    score: "text-orendt-black tabular-nums",
    scoreLive: "text-status-live tabular-nums",
    meta: "text-orendt-gray-400",
    badge: "bg-orendt-gray-100 text-orendt-gray-500 border-orendt-gray-200",
    input: "bg-white border-orendt-gray-200 text-orendt-black focus:border-orendt-black",
    winnerCaret: "text-orendt-gray-400",
  },
  dark: {
    slot: "bg-[#2c2d31] border-[#3a3b40]",
    slotLive: "bg-status-live/10 border-status-live/40",
    slotMissing: "border-orendt-accent/50 ring-1 ring-orendt-accent/25",
    slotLocked: "bg-[#25262a] border-[#3a3b40]",
    header: "border-b border-[#3a3b40]",
    row: "border-b border-[#3a3b40] last:border-b-0",
    rowWinner: "bg-white/[0.06] font-semibold",
    rowDefault: "bg-transparent",
    name: "text-white font-medium",
    nameMuted: "text-orendt-gray-500",
    score: "text-white tabular-nums",
    scoreLive: "text-status-live tabular-nums",
    meta: "text-orendt-gray-500",
    badge: "bg-[#1e1f23] text-orendt-gray-400 border-[#3a3b40]",
    input: "bg-[#1e1f23] border-[#3a3b40] text-white focus:border-orendt-accent",
    winnerCaret: "text-white/70",
  },
}

const SIZES = {
  default: {
    badge: 26,
    name: "text-sm",
    score: "text-base",
    input: "h-8 w-10 p-1 text-base",
    scoreSlot: "h-8 w-10",
    rowH: "h-12",
    bodyPx: "px-5 pb-2",
    headerPx: "px-5 h-9",
    slotW: "w-[18rem]",
  },
  screen: {
    badge: 22,
    name: "text-xs",
    score: "text-sm",
    input: "h-7 w-9 p-1 text-sm",
    scoreSlot: "h-7 w-9",
    rowH: "h-10",
    bodyPx: "px-3 pb-1.5",
    headerPx: "px-3 h-8",
    slotW: "w-[15rem]",
  },
}

function ShieldIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5.25 3.4 10.15 8 11.35 4.6-1.2 8-6.1 8-11.35V5l-8-3Zm0 2.18 6 2.25v4.82c0 4.2-2.7 8.1-6 9.2-3.3-1.1-6-5-6-9.2V6.43l6-2.25Z" />
    </svg>
  )
}

function WinnerCaret({ className = "" }) {
  return (
    <svg viewBox="0 0 8 10" className={`shrink-0 ${className}`} width={6} height={8} aria-hidden="true">
      <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
    </svg>
  )
}

function isOpenTeam(name) {
  return !name || name === "TBD"
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
  const open = isOpenTeam(name)
  const displayName = open ? "Noch offen" : name

  return (
    <div
      className={`flex items-center gap-2.5 ${s.rowH} ${v.row} ${
        isWinner ? v.rowWinner : v.rowDefault
      }`}
    >
      {open ? (
        <ShieldIcon className={v.nameMuted} />
      ) : variant === "dark" ? (
        <ScreenBadge badgeUrl={badgeUrl} teamName={name} flagEmoji={flagEmoji} size={s.badge} />
      ) : (
        <TeamBadge team={team} size={s.badge} flagEmoji={flagEmoji} />
      )}
      <span
        className={`flex-1 truncate font-display leading-tight ${s.name} ${
          isWinner ? v.name : open ? v.nameMuted : v.name
        }`}
        title={displayName}
      >
        {displayName}
      </span>
      {editable ? (
        <input
          type="number"
          min="0"
          max="20"
          value={tipValue}
          onChange={(e) => onTipChange(e.target.value)}
          disabled={disabled}
          className={`${s.input} shrink-0 box-border text-center font-display font-bold rounded-md border outline-none ${v.input}`}
          aria-label={`Tipp ${side} ${displayName}`}
        />
      ) : (
        <div className={`flex items-center justify-end gap-1 shrink-0 ${s.scoreSlot}`}>
          {isWinner && <WinnerCaret className={v.winnerCaret} />}
          <span className={`font-display font-bold min-w-[1rem] text-right ${s.score} ${isLive ? v.scoreLive : v.score}`}>
            {score ?? "–"}
          </span>
        </div>
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
  fullWidth = false,
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
  const projected = isProjectedKnockoutMatch(normalized)
  const canEdit = editable && !locked && !isFinished && !isLive && !projected

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

  const slotClass = missingTip
    ? v.slotMissing
    : isLive
      ? v.slotLive
      : locked && !isFinished
        ? v.slotLocked
        : v.slot

  const kickoffLabel = normalized.kickoffAt ? formatKickoffBracket(normalized.kickoffAt) : "–"

  return (
    <div className={`rounded-xl border overflow-hidden ${fullWidth ? "w-full" : s.slotW} ${slotClass}`}>
      <div className={`flex items-center justify-between gap-2 ${s.headerPx} ${v.header}`}>
        <span className={`text-[11px] font-display truncate ${v.meta}`}>{kickoffLabel}</span>
        {isFinished && (
          <span className={`text-[9px] font-display font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${v.badge} border shrink-0`}>
            Endstand
          </span>
        )}
        {isLive && (
          <span className="text-[9px] font-display font-bold uppercase tracking-wider text-status-live shrink-0">
            Live
          </span>
        )}
        {locked && !isFinished && !isLive && (
          <span className={`text-[9px] font-display font-semibold uppercase tracking-wide shrink-0 ${v.meta}`}>
            Gesperrt
          </span>
        )}
      </div>
      <div className={s.bodyPx}>
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
      </div>
    </div>
  )
}
