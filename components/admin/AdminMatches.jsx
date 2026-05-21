"use client"

import { useEffect, useState } from "react"
import { getMatches } from "@/lib/supabase"
import { formatKickoff, PHASE_LABELS } from "@/lib/dates"
import { StatusBadge } from "@/components/TeamBadge"

export default function AdminMatches() {
  const [matches, setMatches] = useState([])
  const [phaseFilter, setPhaseFilter] = useState("all")

  useEffect(() => {
    getMatches().then(({ data }) => setMatches(data || []))
  }, [])

  const filtered = matches.filter((m) => {
    if (phaseFilter === "all") return true
    if (phaseFilter === "group") return m.phase === "group"
    return m.phase !== "group"
  })

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["all", "group", "ko"].map((f) => (
          <button key={f} onClick={() => setPhaseFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase ${phaseFilter === f ? "bg-orendt-black text-white" : "bg-white border"}`}>
            {f === "all" ? "Alle" : f === "group" ? "Gruppen" : "K.o."}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-orendt-gray-500 text-sm">Keine Spiele. Spielplan-Import starten.</p>
        ) : (
          <div className="divide-y divide-orendt-gray-100 max-h-[600px] overflow-y-auto">
            {filtered.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-display font-bold truncate">
                    {m.home_team?.name || m.placeholder_home} vs {m.away_team?.name || m.placeholder_away}
                  </p>
                  <p className="text-xs text-orendt-gray-400">{formatKickoff(m.kickoff_at)} · {PHASE_LABELS[m.phase] || m.phase}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.manual_override && <span className="text-[10px] font-bold text-orendt-accent uppercase">Override</span>}
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
