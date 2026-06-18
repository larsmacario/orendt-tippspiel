"use client"

import { useMemo } from "react"
import { buildKnockoutBracket, KO_ROUND_LABELS } from "@/lib/knockout-bracket"
import KnockoutRoundColumn from "./KnockoutRoundColumn"
import BracketConnectorLines from "./BracketConnectorLines"
import BracketMatchSlot from "./BracketMatchSlot"

const LAYOUT = {
  default: { columnWidth: 200, rowHeight: 28, slotWidth: 184 },
  screen: { columnWidth: 260, rowHeight: 36, slotWidth: 224 },
}

export default function KnockoutBracket({
  matches,
  predictions = {},
  variant = "light",
  size = "default",
  editable = false,
  highlightMissing = false,
  lockMinutes = 30,
  batchSaving = false,
  onDirtyChange,
  className = "",
}) {
  const bracket = useMemo(() => buildKnockoutBracket(matches), [matches])
  const layout = size === "screen" ? LAYOUT.screen : LAYOUT.default

  if (!bracket.rounds.length && !bracket.final3) {
    return (
      <div
        className={`rounded-2xl border p-10 text-center ${
          variant === "dark"
            ? "border-orendt-gray-800 text-orendt-gray-500"
            : "border-orendt-gray-200 bg-white text-orendt-gray-500"
        } ${className}`}
      >
        Noch keine K.o.-Spiele im Spielplan.
      </div>
    )
  }

  const totalWidth =
    bracket.rounds.length * layout.columnWidth + (bracket.final3 ? layout.columnWidth * 0.6 : 0)
  const totalHeight = bracket.gridRows * layout.rowHeight

  return (
    <div className={className}>
      <div className="relative overflow-x-auto pb-4 scrollbar-hide">
        <p
          className={`sr-only sm:not-sr-only sm:mb-3 sm:text-[10px] font-display uppercase tracking-wider ${
            variant === "dark" ? "text-orendt-gray-600" : "text-orendt-gray-400"
          }`}
        >
          Horizontal scrollen für alle Runden
        </p>
        <div className="relative pt-10" style={{ width: totalWidth, minHeight: totalHeight + 40 }}>
          <BracketConnectorLines
            bracket={bracket}
            columnWidth={layout.columnWidth}
            rowHeight={layout.rowHeight}
            slotWidth={layout.slotWidth}
            variant={variant}
          />
          <div className="relative flex">
            {bracket.rounds.map((round) => (
              <KnockoutRoundColumn
                key={round.phase}
                round={round}
                predictions={predictions}
                variant={variant}
                size={size}
                editable={editable}
                highlightMissing={highlightMissing}
                lockMinutes={lockMinutes}
                batchSaving={batchSaving}
                onDirtyChange={onDirtyChange}
                columnWidth={layout.columnWidth}
                rowHeight={layout.rowHeight}
                gridRows={bracket.gridRows}
              />
            ))}
            {bracket.final3 && (
              <div
                className="relative shrink-0"
                style={{ width: layout.columnWidth * 0.7, height: totalHeight }}
              >
                <div className="absolute inset-x-0 -top-8 text-center">
                  <span
                    className={`font-display font-bold uppercase tracking-wider whitespace-nowrap ${
                      variant === "dark" ? "text-orendt-gray-400 text-sm" : "text-orendt-gray-500 text-[10px]"
                    }`}
                  >
                    {KO_ROUND_LABELS.final3}
                  </span>
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: bracket.final3.rowStart * layout.rowHeight }}
                >
                  <BracketMatchSlot
                    slot={bracket.final3}
                    prediction={predictions[bracket.final3.match.id]}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
