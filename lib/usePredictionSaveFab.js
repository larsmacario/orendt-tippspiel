"use client"

import { useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { upsertPrediction } from "@/lib/supabase"

export function usePredictionSaveFab({ userId, onSaved }) {
  const [dirtyMap, setDirtyMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const registerDirtyChange = useCallback((matchId, { isDirty, homeTip, awayTip, isValid }) => {
    setDirtyMap((prev) => {
      if (!isDirty || !isValid) {
        if (!(matchId in prev)) return prev
        const next = { ...prev }
        delete next[matchId]
        return next
      }
      if (
        prev[matchId]?.homeTip === homeTip &&
        prev[matchId]?.awayTip === awayTip
      ) {
        return prev
      }
      return { ...prev, [matchId]: { homeTip, awayTip } }
    })
  }, [])

  const pendingCount = Object.keys(dirtyMap).length
  const hasPending = pendingCount > 0

  const saveAll = useCallback(async () => {
    if (!userId || pendingCount === 0 || saving) return
    setSaving(true)
    setError("")
    const entries = Object.entries(dirtyMap)
    for (const [matchId, { homeTip, awayTip }] of entries) {
      const { error: err } = await upsertPrediction({
        matchId,
        userId,
        homeTip,
        awayTip,
      })
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    }
    setDirtyMap({})
    setSaving(false)
    onSaved?.()
  }, [userId, dirtyMap, pendingCount, saving, onSaved])

  return {
    registerDirtyChange,
    hasPending,
    pendingCount,
    saveAll,
    saving,
    error,
    clearError: () => setError(""),
  }
}

export function PredictionSaveFab({ hasPending, pendingCount, saveAll, saving, error }) {
  if (!hasPending && !error) return null

  const label =
    pendingCount > 1
      ? saving
        ? "Speichern…"
        : `Speichern (${pendingCount})`
      : saving
        ? "Speichern…"
        : "Speichern"

  const fab = (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      {error && (
        <p className="pointer-events-auto px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl shadow-lg max-w-xs text-center">
          {error}
        </p>
      )}
      {hasPending && (
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="pointer-events-auto min-w-[10rem] px-10 py-3.5 bg-orendt-black text-white rounded-2xl text-[11px] font-display font-bold uppercase tracking-wider shadow-lg hover:bg-orendt-gray-800 transition-colors disabled:opacity-60"
        >
          {label}
        </button>
      )}
    </div>
  )

  if (typeof document === "undefined") return fab
  return createPortal(fab, document.body)
}
