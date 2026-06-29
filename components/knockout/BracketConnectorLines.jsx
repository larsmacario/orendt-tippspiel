"use client"

import { buildConnectorPaths } from "@/lib/knockout-bracket"

export default function BracketConnectorLines({
  bracket,
  columnWidth,
  rowHeight,
  slotWidth,
  width,
  height,
  variant = "light",
}) {
  const paths = buildConnectorPaths(bracket, { columnWidth, rowHeight, slotWidth })
  const stroke = variant === "dark" ? "rgba(255,255,255,0.22)" : "#d1d5db"

  if (paths.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="square"
          shapeRendering="crispEdges"
        />
      ))}
    </svg>
  )
}
