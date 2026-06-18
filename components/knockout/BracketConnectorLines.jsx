"use client"

import { buildConnectorPaths } from "@/lib/knockout-bracket"

export default function BracketConnectorLines({
  bracket,
  columnWidth,
  rowHeight,
  slotWidth,
  variant = "light",
}) {
  const paths = buildConnectorPaths(bracket, { columnWidth, rowHeight, slotWidth })
  const totalWidth = bracket.rounds.length * columnWidth
  const totalHeight = bracket.gridRows * rowHeight
  const stroke = variant === "dark" ? "#333" : "#e5e5e5"

  if (paths.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={`M ${p.x1} ${p.y1} H ${p.x2} V ${p.y3} H ${p.x4}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}
