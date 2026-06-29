"use client"

import { Seed, SeedItem } from "react-brackets"
import BracketMatchSlot from "./BracketMatchSlot"
import { createTbdMatch } from "@/lib/knockout-bracket"

const SEED_FONT_SIZE = 14

const PLACEHOLDER_MATCH = createTbdMatch("r32", -1)

/**
 * Custom Seed – exakt nach react-brackets README / Example:
 * https://github.com/mohux/react-brackets#readme
 */
export default function KnockoutBracketSeed({
  seed,
  breakpoint,
  seedIndex,
  predictions,
  variant,
  size,
  editable,
  highlightMissing,
  lockMinutes,
  batchSaving,
  onDirtyChange,
}) {
  if (seed.isPlaceholder) {
    const slot = { match: PLACEHOLDER_MATCH, slotIndex: seedIndex, rowStart: 0, rowSpan: 2 }
    return (
      <Seed mobileBreakpoint={breakpoint} style={{ fontSize: SEED_FONT_SIZE }} className="ko-bracket-seed ko-bracket-seed--placeholder">
        <SeedItem style={{ background: "transparent", boxShadow: "none", padding: 0, visibility: "hidden" }} aria-hidden="true">
          <BracketMatchSlot
            slot={slot}
            variant={variant}
            size={size}
            editable={false}
            lockMinutes={lockMinutes}
            fullWidth
          />
        </SeedItem>
      </Seed>
    )
  }

  const slot = { match: seed.match, slotIndex: seedIndex, rowStart: 0, rowSpan: 2 }

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: SEED_FONT_SIZE }} className="ko-bracket-seed">
      <SeedItem style={{ background: "transparent", boxShadow: "none", padding: 0 }}>
        <BracketMatchSlot
          slot={slot}
          prediction={predictions[seed.match.id]}
          variant={variant}
          size={size}
          editable={editable}
          highlightMissing={highlightMissing}
          lockMinutes={lockMinutes}
          batchSaving={batchSaving}
          onDirtyChange={onDirtyChange}
          fullWidth
        />
      </SeedItem>
    </Seed>
  )
}
