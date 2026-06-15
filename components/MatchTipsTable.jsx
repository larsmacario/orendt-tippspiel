"use client"

function formatTip(homeTip, awayTip) {
  if (homeTip == null || awayTip == null) return "–"
  return `${homeTip}:${awayTip}`
}

function formatPoints(points) {
  if (points == null) return "–"
  return String(points)
}

export default function MatchTipsTable({ tips, currentUserId, showPoints = false, compact = false }) {
  if (!tips?.length) {
    return (
      <p className={`text-orendt-gray-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
        Noch keine Tipps vorhanden.
      </p>
    )
  }

  const cellPad = compact ? "px-2 py-1.5" : "px-3 py-2"
  const textSize = compact ? "text-[10px]" : "text-[11px]"

  return (
    <div className="overflow-x-auto -mx-1">
      <table className={`w-full ${textSize} text-left`}>
        <thead>
          <tr className="text-orendt-gray-400 uppercase tracking-wider font-display font-bold">
            <th className={`${cellPad} font-bold`}>Spieler</th>
            <th className={`${cellPad} font-bold text-center`}>Tipp</th>
            {showPoints && <th className={`${cellPad} font-bold text-right`}>Pkt.</th>}
          </tr>
        </thead>
        <tbody>
          {tips.map((tip) => {
            const isSelf = tip.userId === currentUserId
            return (
              <tr
                key={tip.userId}
                className={isSelf ? "bg-orendt-gray-50 font-semibold text-orendt-black" : "text-orendt-gray-600"}
              >
                <td className={`${cellPad} truncate max-w-[8rem] sm:max-w-none`}>
                  {tip.displayName}
                  {isSelf && (
                    <span className="ml-1 text-orendt-gray-400 font-normal">(du)</span>
                  )}
                </td>
                <td className={`${cellPad} text-center tabular-nums`}>
                  {formatTip(tip.homeTip, tip.awayTip)}
                </td>
                {showPoints && (
                  <td className={`${cellPad} text-right tabular-nums`}>
                    {formatPoints(tip.points)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
