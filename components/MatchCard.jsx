"use client"

import { TeamBadge, StatusBadge } from "./TeamBadge"
import { formatKickoff } from "@/lib/dates"

export default function MatchCard({ match, prediction, compact = false }) {
  const homeName = match.home_team?.name || match.placeholder_home || "TBD"
  const awayName = match.away_team?.name || match.placeholder_away || "TBD"

  return (
    <div className={`bg-white rounded-2xl border border-orendt-gray-200 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
          {formatKickoff(match.kickoff_at)}
        </span>
        <StatusBadge status={match.status} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamBadge team={match.home_team} size={28} />
          <span className="font-display font-bold text-sm truncate">{homeName}</span>
        </div>
        <div className="font-display font-bold text-lg shrink-0">
          {match.status === "finished"
            ? `${match.home_score}:${match.away_score}`
            : prediction
              ? `${prediction.home_tip}:${prediction.away_tip}`
              : "–"}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-display font-bold text-sm truncate text-right">{awayName}</span>
          <TeamBadge team={match.away_team} size={28} />
        </div>
      </div>
      {prediction?.points != null && match.status === "finished" && (
        <p className="mt-2 text-[11px] text-orendt-gray-500">{prediction.points} Punkte</p>
      )}
    </div>
  )
}
