"use client"

import BracketMatchSlot from "./BracketMatchSlot"

export default function KnockoutRoundColumn({
  round,
  predictions = {},
  variant = "light",
  size = "default",
  editable = false,
  highlightMissing = false,
  lockMinutes = 30,
  batchSaving = false,
  onDirtyChange,
  columnWidth,
  rowHeight,
  gridRows,
}) {
  const height = gridRows * rowHeight

  return (
    <div className="relative shrink-0" style={{ width: columnWidth, height }}>
      <div className="absolute inset-x-0 -top-8 text-center">
        <span
          className={`font-display font-bold uppercase tracking-wider whitespace-nowrap ${
            variant === "dark" ? "text-orendt-gray-400 text-sm" : "text-orendt-gray-500 text-[10px]"
          }`}
        >
          {round.label}
        </span>
      </div>
      {round.slots.map((slot) => (
        <div
          key={slot.match.id}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: slot.rowStart * rowHeight,
            height: slot.rowSpan * rowHeight,
          }}
        >
          <div className="flex h-full items-center">
            <BracketMatchSlot
              slot={slot}
              prediction={predictions[slot.match.id]}
              variant={variant}
              size={size}
              editable={editable}
              highlightMissing={highlightMissing}
              lockMinutes={lockMinutes}
              batchSaving={batchSaving}
              onDirtyChange={onDirtyChange}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
