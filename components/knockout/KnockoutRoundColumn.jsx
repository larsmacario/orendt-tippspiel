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
      <div className="absolute inset-x-0 -top-9">
        <div className="ko-react-bracket-round-title">{round.label}</div>
      </div>
      {round.slots.map((slot) => (
        <div
          key={slot.match.id}
          className="absolute left-1/2 z-10 -translate-x-1/2"
          style={{
            top: slot.rowStart * rowHeight,
            height: slot.rowSpan * rowHeight,
          }}
        >
          <div className="flex h-full items-center justify-center">
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
