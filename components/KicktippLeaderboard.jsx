"use client"

import { formatTeamCode } from "@/lib/leaderboard-matrix"

const SUMMARY_LEGEND = [
  { key: "P", label: "Punkte in den letzten 5 Spielen", accent: true },
  { key: "B", label: "WM-Bonus" },
  { key: "S", label: "Schnitt pro getipptem Spiel" },
  { key: "G", label: "Gesamtpunkte", bold: true },
]

function SummaryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-b border-orendt-gray-100 bg-orendt-gray-50/50">
      {SUMMARY_LEGEND.map((item) => (
        <span key={item.key} className="text-[10px] text-orendt-gray-400">
          <span
            className={`font-display font-bold mr-1 ${
              item.accent ? "text-orendt-accent" : item.bold ? "text-orendt-black" : "text-orendt-gray-500"
            }`}
          >
            {item.key}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  )
}

function MatchHeader({ match }) {
  const homeCode = formatTeamCode(match.home_team, match.placeholder_home)
  const awayCode = formatTeamCode(match.away_team, match.placeholder_away)
  const score =
    match.home_score != null && match.away_score != null
      ? `${match.home_score}:${match.away_score}`
      : "–"

  return (
    <div className="text-center leading-tight min-w-[3.25rem]">
      <div className="text-[9px] font-display font-bold text-orendt-gray-500 uppercase tracking-wide">
        {homeCode}
      </div>
      <div className="text-[9px] font-display font-bold text-orendt-gray-500 uppercase tracking-wide">
        {awayCode}
      </div>
      <div className="text-[10px] font-display font-bold text-orendt-black mt-0.5 tabular-nums">
        {score}
      </div>
    </div>
  )
}

function TipCell({ cell }) {
  if (cell.homeTip == null || cell.awayTip == null) {
    return <span className="text-orendt-gray-300">–</span>
  }

  const tip = `${cell.homeTip}:${cell.awayTip}`
  const points = cell.points ?? 0
  const scored = points > 0

  return (
    <span className={scored ? "text-orendt-black font-semibold" : "text-orendt-gray-400"}>
      {tip}
      {scored && (
        <sup className="ml-0.5 text-[9px] font-bold text-orendt-accent align-super">
          {points}
        </sup>
      )}
    </span>
  )
}

export default function KicktippLeaderboard({ data, currentUserId }) {
  const matches = data?.matches || []
  const rows = data?.rows || []

  if (!matches.length) {
    return (
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 text-center text-orendt-gray-500">
        Noch keine beendeten Spiele — die Matrix füllt sich nach den ersten Ergebnissen.
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 text-center text-orendt-gray-500">
        Noch keine Ranglistendaten.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
      <SummaryLegend />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[11px] border-collapse">
          <thead>
            <tr className="bg-orendt-gray-50 border-b border-orendt-gray-200 text-[9px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">
              <th className="px-2 py-2 text-left w-10 sticky left-0 bg-orendt-gray-50 z-10">Pos</th>
              <th className="px-2 py-2 text-center w-10">+/-</th>
              <th className="px-3 py-2 text-left min-w-[7rem] sticky left-10 bg-orendt-gray-50 z-10">Name</th>
              {matches.map((match) => (
                <th key={match.id} className="px-2 py-2 text-center">
                  <MatchHeader match={match} />
                </th>
              ))}
              <th className="px-2 py-2 text-center w-10 text-orendt-accent">P</th>
              <th className="px-2 py-2 text-center w-10">B</th>
              <th className="px-2 py-2 text-center w-12">S</th>
              <th className="px-2 py-2 text-center w-10 font-bold text-orendt-black">G</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMe = row.userId === currentUserId
              const rowBg = isMe ? "bg-orendt-accent/15" : "bg-white"
              const stickyBg = isMe ? "bg-orendt-accent/15" : "bg-white"

              return (
                <tr
                  key={row.userId}
                  className={`border-b border-orendt-gray-100 last:border-0 ${rowBg}`}
                >
                  <td className={`px-2 py-2 font-display font-bold text-orendt-gray-500 sticky left-0 z-10 ${stickyBg}`}>
                    {row.rank}.
                  </td>
                  <td className="px-2 py-2 text-center font-display font-bold text-orendt-gray-500 tabular-nums">
                    {row.rankDeltaLabel || ""}
                  </td>
                  <td className={`px-3 py-2 font-display font-bold text-sm text-orendt-black truncate max-w-[9rem] sticky left-10 z-10 ${stickyBg}`}>
                    {row.displayName}
                    {isMe && <span className="text-orendt-gray-400 font-normal text-[10px] ml-1">(du)</span>}
                  </td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.userId}-${matches[index]?.id}`} className="px-2 py-2 text-center tabular-nums">
                      <TipCell cell={cell} />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-display font-bold text-orendt-accent tabular-nums">
                    {row.windowPoints}
                  </td>
                  <td className="px-2 py-2 text-center text-orendt-gray-600 tabular-nums">
                    {row.championBonus || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-orendt-gray-600 tabular-nums">
                    {row.windowAverage}
                  </td>
                  <td className="px-2 py-2 text-center font-display font-bold text-orendt-black tabular-nums">
                    {row.totalPoints}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
