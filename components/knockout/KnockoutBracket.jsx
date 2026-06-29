"use client"

import { useMemo, useRef, useEffect } from "react"
import { buildVisibleKnockoutBracket, KO_ROUND_LABELS, KO_ROUND_ORDER } from "@/lib/knockout-bracket"
import { isLocked } from "@/lib/dates"
import KnockoutRoundColumn from "./KnockoutRoundColumn"
import BracketConnectorLines from "./BracketConnectorLines"
import BracketMatchSlot from "./BracketMatchSlot"
import "./knockout-bracket.css"

const LAYOUT = {
  // rowHeight × 2 ≈ Kartenhöhe (~142px); slotWidth = w-[18rem]
  default: { columnWidth: 312, rowHeight: 71, slotWidth: 288 },
  screen: { columnWidth: 272, rowHeight: 60, slotWidth: 240 },
}

const ROUND_TITLE_SPACE = 36

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
  const scrollRef = useRef(null)
  const bracket = useMemo(
    () => buildVisibleKnockoutBracket(matches, { depth: KO_ROUND_ORDER.length }),
    [matches]
  )
  const layout = size === "screen" ? LAYOUT.screen : LAYOUT.default
  const multiRound = bracket.rounds.length > 1

  const tippableRoundIndex = useMemo(() => {
    for (let i = 0; i < bracket.rounds.length; i++) {
      const hasTippable = bracket.rounds[i].slots.some((slot) => {
        const m = slot.match
        return m?.status === "scheduled" && !isLocked(m.kickoffAt, lockMinutes)
      })
      if (hasTippable) return i
    }
    return 0
  }, [bracket.rounds, lockMinutes])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || bracket.rounds.length === 0) return
    const targetLeft = Math.max(0, tippableRoundIndex * layout.columnWidth - 16)
    el.scrollTo({ left: targetLeft, behavior: "smooth" })
  }, [tippableRoundIndex, bracket.rounds.length, layout.columnWidth])

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
    bracket.rounds.length * layout.columnWidth + (bracket.final3 ? layout.columnWidth * 0.65 : 0)
  const totalHeight = bracket.gridRows * layout.rowHeight
  const themeClass = `ko-bracket-grid--${variant === "dark" ? "dark" : "light"}`

  return (
    <div className={className}>
      <div
        ref={scrollRef}
        className={`relative overflow-x-auto overflow-y-auto max-h-[min(88vh,1400px)] pb-4 scrollbar-hide rounded-2xl ${
          variant === "dark" ? "bg-[#1a1b1e]" : "bg-orendt-gray-50/80"
        }`}
      >
        <p
          className={`sticky top-0 z-20 px-3 py-2 backdrop-blur-sm sr-only sm:not-sr-only sm:text-[11px] font-display uppercase tracking-wider ${
            variant === "dark" ? "text-orendt-gray-600 bg-[#1a1b1e]/95" : "text-orendt-gray-400 bg-orendt-gray-50/95"
          }`}
        >
          {multiRound
            ? "K.o.-Baum · horizontal scrollen für Viertelfinale, Halbfinale und Finale"
            : "Runde der letzten 32 · vertikal scrollen für alle Spiele"}
        </p>
        <div className="px-3 pb-4 pt-2">
          <div style={{ width: totalWidth, paddingTop: ROUND_TITLE_SPACE }}>
            <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
              <BracketConnectorLines
                bracket={bracket}
                columnWidth={layout.columnWidth}
                rowHeight={layout.rowHeight}
                slotWidth={layout.slotWidth}
                width={totalWidth}
                height={totalHeight}
                variant={variant}
              />
              <div
                className={`absolute left-0 top-0 z-10 flex ${themeClass}`}
                style={{ width: totalWidth, height: totalHeight }}
              >
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
                  <div className="relative shrink-0" style={{ width: layout.columnWidth * 0.65, height: totalHeight }}>
                    <div className="absolute inset-x-0 -top-9">
                      <div className="ko-react-bracket-round-title">{KO_ROUND_LABELS.final3}</div>
                    </div>
                    <div
                      className="absolute left-1/2 z-10 -translate-x-1/2"
                      style={{
                        top: bracket.final3.rowStart * layout.rowHeight,
                        height: bracket.final3.rowSpan * layout.rowHeight,
                      }}
                    >
                      <div className="flex h-full items-center justify-center">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
