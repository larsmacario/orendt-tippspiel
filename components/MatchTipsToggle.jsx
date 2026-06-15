"use client"

import { useState, useCallback } from "react"
import { canRevealOtherTips } from "@/lib/dates"
import { getMatchTipsWithProfiles } from "@/lib/supabase"
import MatchTipsTable from "./MatchTipsTable"

export default function MatchTipsToggle({
  match,
  userId,
  compact = false,
  className = "",
}) {
  const [expanded, setExpanded] = useState(false)
  const [tips, setTips] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canReveal = canRevealOtherTips(match)
  const showPoints = match.status === "finished"

  const loadTips = useCallback(async () => {
    if (tips != null) return
    setLoading(true)
    setError("")
    const { data, error: err } = await getMatchTipsWithProfiles(match.id)
    setLoading(false)
    if (err) {
      setError(err.message || "Tipps konnten nicht geladen werden.")
      return
    }
    setTips(data || [])
  }, [match.id, tips])

  const toggle = useCallback(async () => {
    if (!expanded) {
      await loadTips()
      setExpanded(true)
      return
    }
    setExpanded(false)
  }, [expanded, loadTips])

  if (!canReveal) {
    return (
      <p className={`text-orendt-gray-400 ${compact ? "text-[10px] mt-2" : "text-[11px] mt-3"} ${className}`}>
        Tipps der anderen ab Anpfiff sichtbar
      </p>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className={`mt-3 text-[11px] font-display font-bold uppercase tracking-wider transition-colors ${
          compact ? "text-orendt-gray-500 hover:text-orendt-black" : "text-orendt-accent hover:text-orendt-black"
        }`}
        aria-expanded={expanded}
      >
        {expanded ? "Tipps ausblenden" : "Alle Tipps"}
      </button>
      {expanded && (
        <div className={`mt-3 rounded-xl border border-orendt-gray-100 bg-orendt-gray-50/50 ${compact ? "p-2" : "p-3"}`}>
          {loading && (
            <p className={`text-orendt-gray-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>Lade Tipps…</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {!loading && !error && tips && (
            <MatchTipsTable
              tips={tips}
              currentUserId={userId}
              showPoints={showPoints}
              compact={compact}
            />
          )}
        </div>
      )}
    </div>
  )
}
