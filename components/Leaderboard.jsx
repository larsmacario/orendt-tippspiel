"use client"

import { TeamBadge } from "./TeamBadge"

export default function Leaderboard({ rows, currentUserId, compact = false }) {
  if (!rows?.length) {
    return (
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 text-center text-orendt-gray-500">
        Noch keine Ranglistendaten.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_80px_80px] sm:grid-cols-[56px_1fr_100px_100px_100px] gap-2 px-4 py-3 bg-orendt-gray-50 border-b border-orendt-gray-200 text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
        <span>#</span>
        <span>Spieler</span>
        {!compact && <span className="hidden sm:block">Exakt</span>}
        {!compact && <span className="hidden sm:block">WM-Tipp</span>}
        <span className="text-right">Punkte</span>
      </div>
      <div className="divide-y divide-orendt-gray-100">
        {rows.map((row, index) => {
          const isMe = row.user_id === currentUserId
          return (
            <div
              key={row.user_id}
              className={`grid grid-cols-[48px_1fr_80px_80px] sm:grid-cols-[56px_1fr_100px_100px_100px] gap-2 px-4 py-3 items-center ${isMe ? "bg-orendt-accent/10" : ""}`}
            >
              <span className="font-display font-bold text-orendt-gray-500">{index + 1}</span>
              <div className="min-w-0">
                <p className="font-display font-bold text-sm text-orendt-black truncate">
                  {row.display_name}
                  {isMe && <span className="text-orendt-gray-400 font-normal ml-1">(Du)</span>}
                </p>
              </div>
              {!compact && (
                <span className="hidden sm:block text-sm text-orendt-gray-600">{row.exact_hits}</span>
              )}
              {!compact && (
                <div className="hidden sm:flex items-center gap-1 min-w-0">
                  {row.champion_badge_url ? (
                    <TeamBadge team={{ badge_url: row.champion_badge_url, name: row.champion_team_name }} size={20} />
                  ) : (
                    <span className="text-xs text-orendt-gray-400">–</span>
                  )}
                </div>
              )}
              <span className="font-display font-bold text-sm text-right text-orendt-black">
                {row.total_points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
