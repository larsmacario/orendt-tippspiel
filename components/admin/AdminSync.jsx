"use client"

import { useEffect, useState } from "react"
import { getSyncLogs, triggerSync } from "@/lib/supabase"

export default function AdminSync() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadLogs() {
    const { data } = await getSyncLogs(15)
    setLogs(data || [])
  }

  useEffect(() => { loadLogs() }, [])

  async function runSync(mode) {
    setLoading(true)
    setMessage("")
    setError("")
    const { data, error: err } = await triggerSync(mode, true)
    setLoading(false)
    if (err) setError(err.message)
    else {
      setMessage(`Sync (${mode}) gestartet: ${JSON.stringify(data)}`)
      setTimeout(loadLogs, 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
        <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-4">Manueller Sync</h2>
        <div className="flex flex-wrap gap-3">
          {["teams", "schedule", "live", "all"].map((mode) => (
            <button
              key={mode}
              onClick={() => runSync(mode)}
              disabled={loading}
              className="px-5 py-3 bg-orendt-black text-white font-display font-bold text-[11px] uppercase tracking-wider rounded-xl disabled:opacity-50"
            >
              {mode === "teams" ? "Teams importieren" : mode === "schedule" ? "Spielplan importieren" : mode === "live" ? "Live-Scores" : "Alles synchronisieren"}
            </button>
          ))}
        </div>
        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-orendt-gray-200">
          <h2 className="font-display font-bold uppercase tracking-wider text-sm">Sync-Protokoll</h2>
        </div>
        {logs.length === 0 ? (
          <p className="p-6 text-orendt-gray-500 text-sm">Noch keine Sync-Läufe.</p>
        ) : (
          <div className="divide-y divide-orendt-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-4 text-sm grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-orendt-gray-500">{new Date(log.started_at).toLocaleString("de-DE")}</span>
                <span className="font-display font-bold uppercase text-xs">{log.mode || log.source}</span>
                <span className={log.status === "success" ? "text-green-600" : log.status === "error" ? "text-red-600" : "text-orendt-gray-500"}>
                  {log.status} ({log.matches_updated ?? 0} Updates)
                </span>
                {log.error_message && <span className="text-red-500 truncate">{log.error_message}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
