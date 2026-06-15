"use client"

import { TeamBadge, StatusBadge } from "./TeamBadge"
import { formatKickoff, formatRawStatus } from "@/lib/dates"
import MatchTipsToggle from "./MatchTipsToggle"

function formatScore(home, away) {
  if (home == null || away == null) return "–"
  return `${home}:${away}`
}

export default function MatchCard({ match, prediction, userId, compact = false }) {
  const homeName = match.home_team?.name || match.placeholder_home || "TBD"
  const awayName = match.away_team?.name || match.placeholder_away || "TBD"
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const phaseLabel = formatRawStatus(match.raw_status)

  const centerScore = isFinished || isLive
    ? formatScore(match.home_score, match.away_score)
    : prediction
      ? `${prediction.home_tip}:${prediction.away_tip}`
      : "–"

  return (
    <div
      className={`rounded-2xl border ${compact ? "p-4" : "p-5"} ${
        isLive
          ? "bg-status-live-bg/40 border-status-live/50 shadow-sm"
          : "bg-white border-orendt-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
            {formatKickoff(match.kickoff_at)}
          </span>
          {isLive && phaseLabel && (
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-status-live truncate">
              {phaseLabel}
            </span>
          )}
        </div>
        <StatusBadge status={match.status} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamBadge team={match.home_team} size={28} />
          <span className="font-display font-bold text-sm truncate">{homeName}</span>
        </div>
        <div className={`font-display font-bold shrink-0 text-center ${isLive ? "text-xl text-status-live" : "text-lg"}`}>
          {centerScore}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-display font-bold text-sm truncate text-right">{awayName}</span>
          <TeamBadge team={match.away_team} size={28} />
        </div>
      </div>
      {(isLive || isFinished) && (
        <p className="mt-2 text-[11px] text-orendt-gray-500 text-center">
          {prediction
            ? isFinished && prediction.points != null
              ? `Dein Tipp: ${prediction.home_tip}:${prediction.away_tip} · ${prediction.points} Punkte`
              : `Dein Tipp: ${prediction.home_tip}:${prediction.away_tip}`
            : "Kein Tipp abgegeben"}
        </p>
      )}
      {userId && <MatchTipsToggle match={match} userId={userId} compact={compact} />}
    </div>
  )
}
