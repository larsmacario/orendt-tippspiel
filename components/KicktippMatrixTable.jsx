"use client"

import {
  formatTeamCode,
  formatRankDeltaCaption,
  formatRankDeltaHint,
  SUMMARY_LEGEND,
} from "@/lib/leaderboard-matrix"

const VARIANTS = {
  light: {
    wrapper: "bg-white border-orendt-gray-200",
    legend: "border-orendt-gray-100 bg-orendt-gray-50/50 text-orendt-gray-400",
    legendKey: {
      accent: "text-orendt-accent",
      bold: "text-orendt-black",
      default: "text-orendt-gray-500",
    },
    thead: "bg-orendt-gray-50 border-orendt-gray-200 text-orendt-gray-400",
    theadSticky: "bg-orendt-gray-50",
    theadG: "text-orendt-black",
    rowBorder: "border-orendt-gray-100",
    rowHighlight: "bg-orendt-accent/15",
    rowDefault: "bg-white",
    rank: "text-orendt-gray-500",
    name: "text-orendt-black",
    nameYou: "text-orendt-gray-400",
    tipScored: "text-orendt-black font-semibold",
    tipMiss: "text-orendt-gray-400",
    tipEmpty: "text-orendt-gray-300",
    tipSup: "text-orendt-accent",
    matchCode: "text-orendt-gray-500",
    matchScore: "text-orendt-black",
    pCol: "text-orendt-accent",
    sumCol: "text-orendt-gray-600",
    gCol: "text-orendt-black",
    pHead: "text-orendt-accent",
  },
  dark: {
    wrapper: "",
    legend: "border-orendt-gray-800 text-orendt-gray-500",
    legendKey: {
      accent: "text-orendt-accent",
      bold: "text-white",
      default: "text-orendt-gray-500",
    },
    thead: "border-orendt-gray-800 text-orendt-gray-500",
    theadSticky: "bg-[#111]",
    theadG: "text-white",
    rowBorder: "border-orendt-gray-800",
    rowHighlight: "bg-orendt-accent/10",
    rowDefault: "bg-transparent",
    rank: "text-orendt-gray-500",
    name: "text-white",
    nameYou: "text-orendt-gray-500",
    tipScored: "text-white font-semibold",
    tipMiss: "text-orendt-gray-500",
    tipEmpty: "text-orendt-gray-600",
    tipSup: "text-orendt-accent",
    matchCode: "text-orendt-gray-500",
    matchScore: "text-white",
    pCol: "text-orendt-accent",
    sumCol: "text-orendt-gray-400",
    gCol: "text-white",
    pHead: "text-orendt-accent",
  },
}

const SIZES = {
  default: {
    legend: "text-[11px]",
    table: "text-[13px]",
    thead: "text-[10px]",
    name: "text-sm",
    nameYou: "text-[11px]",
    matchCode: "text-[10px]",
    matchScore: "text-[11px]",
    tipSup: "text-[10px]",
    matchMinW: "min-w-[3rem]",
    cellPy: "py-2",
    posW: "w-9 min-w-[2.25rem]",
    deltaW: "w-10 min-w-[2.5rem]",
    stickyPos: "left-0",
    stickyDelta: "left-9",
    stickyName: "left-[4.75rem]",
    pW: "w-9",
    bW: "w-9",
    sW: "w-11",
    gW: "w-9",
  },
  screen: {
    legend: "text-sm",
    table: "text-xl",
    thead: "text-sm",
    name: "text-xl",
    nameYou: "text-sm",
    matchCode: "text-xs",
    matchScore: "text-sm",
    tipSup: "text-xs",
    matchMinW: "min-w-[3.75rem]",
    cellPy: "py-3",
    posW: "w-11 min-w-[2.75rem]",
    deltaW: "w-12 min-w-[3rem]",
    stickyPos: "left-0",
    stickyDelta: "left-11",
    stickyName: "left-[5.75rem]",
    pW: "w-11",
    bW: "w-11",
    sW: "w-14",
    gW: "w-11",
  },
}

function SummaryLegend({ variant, size, snapshotMatchday, className = "" }) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  return (
    <div className={`px-4 py-2.5 border-b ${v.legend} ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {SUMMARY_LEGEND.map((item) => (
          <span key={item.key} className={s.legend}>
            <span
              className={`font-display font-bold mr-1 ${
                item.accent ? v.legendKey.accent : item.bold ? v.legendKey.bold : v.legendKey.default
              }`}
            >
              {item.key}
            </span>
            {item.label}
          </span>
        ))}
      </div>
      {snapshotMatchday && (
        <p className={`mt-2 ${s.legend} leading-relaxed ${v.legendKey.default}`}>
          <span className={`font-display font-bold mr-1 ${v.legendKey.bold}`}>+/-</span>
          {formatRankDeltaHint(snapshotMatchday)}
        </p>
      )}
    </div>
  )
}

function MatchHeader({ match, variant, size }) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  const homeCode = formatTeamCode(match.home_team, match.placeholder_home)
  const awayCode = formatTeamCode(match.away_team, match.placeholder_away)
  const score =
    match.home_score != null && match.away_score != null
      ? `${match.home_score}:${match.away_score}`
      : "–"

  return (
    <div className={`text-center leading-tight ${s.matchMinW}`}>
      <div className={`${s.matchCode} font-display font-bold uppercase tracking-wide ${v.matchCode}`}>
        {homeCode}
      </div>
      <div className={`${s.matchCode} font-display font-bold uppercase tracking-wide ${v.matchCode}`}>
        {awayCode}
      </div>
      <div className={`${s.matchScore} font-display font-bold mt-0.5 tabular-nums ${v.matchScore}`}>
        {score}
      </div>
    </div>
  )
}

function TipCell({ cell, variant, size }) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  if (cell.homeTip == null || cell.awayTip == null) {
    return <span className={v.tipEmpty}>–</span>
  }

  const tip = `${cell.homeTip}:${cell.awayTip}`
  const points = cell.points ?? 0
  const scored = points > 0

  return (
    <span className={scored ? v.tipScored : v.tipMiss}>
      {tip}
      {scored && (
        <sup className={`ml-0.5 ${s.tipSup} font-bold align-super ${v.tipSup}`}>
          {points}
        </sup>
      )}
    </span>
  )
}

export default function KicktippMatrixTable({
  rows = [],
  matches = [],
  currentUserId = null,
  snapshotMatchday = null,
  variant = "light",
  size = "default",
  showLegend = true,
  className = "",
}) {
  const v = VARIANTS[variant]
  const s = SIZES[size] ?? SIZES.default
  const rankDeltaHint = formatRankDeltaHint(snapshotMatchday)
  const stickyShadow =
    variant === "dark"
      ? "shadow-[4px_0_8px_-4px_rgba(0,0,0,0.45)]"
      : "shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]"

  return (
    <div className={`overflow-hidden ${v.wrapper} ${className}`}>
      {showLegend && (
        <SummaryLegend variant={variant} size={size} snapshotMatchday={snapshotMatchday} />
      )}
      <div className="overflow-x-auto">
        <table className={`w-full min-w-0 ${s.table} border-collapse`}>
          <thead>
            <tr className={`border-b ${s.thead} font-display font-bold uppercase tracking-wider ${v.thead}`}>
              <th className={`px-2 ${s.cellPy} text-left ${s.posW} sticky ${s.stickyPos} z-20 ${v.theadSticky}`}>Pos</th>
              <th
                className={`px-1.5 ${s.cellPy} text-center ${s.deltaW} sticky ${s.stickyDelta} z-20 ${v.theadSticky}`}
                title={rankDeltaHint}
              >
                +/-
              </th>
              <th className={`px-2 ${s.cellPy} text-left whitespace-nowrap sticky ${s.stickyName} z-20 ${stickyShadow} ${v.theadSticky}`}>Name</th>
              {matches.map((match) => (
                <th key={match.id} className={`px-2 ${s.cellPy} text-center`}>
                  <MatchHeader match={match} variant={variant} size={size} />
                </th>
              ))}
              <th className={`px-2 ${s.cellPy} text-center ${s.pW} ${v.pHead}`}>P</th>
              <th className={`px-2 ${s.cellPy} text-center ${s.bW}`}>B</th>
              <th className={`px-2 ${s.cellPy} text-center ${s.sW}`}>S</th>
              <th className={`px-2 ${s.cellPy} text-center ${s.gW} font-bold ${v.theadG}`}>G</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMe = currentUserId && row.userId === currentUserId
              const rowBg = isMe ? v.rowHighlight : v.rowDefault

              return (
                <tr key={row.userId} className={`border-b last:border-0 ${v.rowBorder} ${rowBg}`}>
                  <td className={`px-2 ${s.cellPy} font-display font-bold tabular-nums sticky ${s.stickyPos} z-10 ${rowBg} ${v.rank}`}>
                    {row.rank}.
                  </td>
                  <td className={`px-1.5 ${s.cellPy} text-center font-display font-bold tabular-nums sticky ${s.stickyDelta} z-10 ${rowBg} ${v.rank}`}>
                    {row.rankDeltaLabel || ""}
                  </td>
                  <td className={`px-2 ${s.cellPy} font-display font-bold ${s.name} whitespace-nowrap sticky ${s.stickyName} z-10 ${stickyShadow} ${rowBg} ${v.name}`}>
                    {row.displayName}
                    {isMe && <span className={`font-normal ${s.nameYou} ml-1 ${v.nameYou}`}>(du)</span>}
                  </td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.userId}-${matches[index]?.id}`} className={`px-2 ${s.cellPy} text-center tabular-nums`}>
                      <TipCell cell={cell} variant={variant} size={size} />
                    </td>
                  ))}
                  <td className={`px-2 ${s.cellPy} text-center font-display font-bold tabular-nums ${v.pCol}`}>
                    {row.windowPoints}
                  </td>
                  <td className={`px-2 ${s.cellPy} text-center tabular-nums ${v.sumCol}`}>
                    {row.championBonus || 0}
                  </td>
                  <td className={`px-2 ${s.cellPy} text-center tabular-nums ${v.sumCol}`}>
                    {row.windowAverage}
                  </td>
                  <td className={`px-2 ${s.cellPy} text-center font-display font-bold tabular-nums ${v.gCol}`}>
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
