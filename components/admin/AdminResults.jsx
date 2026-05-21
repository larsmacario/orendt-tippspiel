"use client"

import { useEffect, useState } from "react"
import { getMatches, updateMatch } from "@/lib/supabase"
import { formatKickoff } from "@/lib/dates"

export default function AdminResults() {
  const [matches, setMatches] = useState([])
  const [saving, setSaving] = useState(null)

  async function load() {
    const { data } = await getMatches()
    setMatches((data || []).filter((m) => m.status !== "finished" || m.manual_override))
  }

  useEffect(() => { load() }, [])

  async function saveResult(matchId, homeScore, awayScore, finish = false) {
    setSaving(matchId)
    await updateMatch(matchId, {
      home_score: parseInt(homeScore, 10),
      away_score: parseInt(awayScore, 10),
      status: finish ? "finished" : "live",
      manual_override: true,
    })
    setSaving(null)
    load()
  }

  const editable = matches.filter((m) => m.home_team_id && m.away_team_id)

  return (
    <div className="space-y-4">
      <p className="text-sm text-orendt-gray-500">Manuelle Ergebnis-Eingabe setzt manual_override und schützt vor Sync-Überschreibung.</p>
      {editable.length === 0 ? (
        <div className="bg-white rounded-2xl border p-6 text-orendt-gray-500 text-sm">Keine Spiele zum Bearbeiten.</div>
      ) : (
        editable.slice(0, 30).map((m) => (
          <ResultRow key={m.id} match={m} saving={saving === m.id} onSave={saveResult} />
        ))
      )}
    </div>
  )
}

function ResultRow({ match, saving, onSave }) {
  const [home, setHome] = useState(match.home_score ?? "")
  const [away, setAway] = useState(match.away_score ?? "")

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 p-4">
      <p className="font-display font-bold text-sm mb-1">
        {match.home_team?.name} vs {match.away_team?.name}
      </p>
      <p className="text-xs text-orendt-gray-400 mb-3">{formatKickoff(match.kickoff_at)}</p>
      <div className="flex items-center gap-3">
        <input type="number" min="0" max="20" value={home} onChange={(e) => setHome(e.target.value)} className="w-16 px-3 py-2 border rounded-xl text-center" />
        <span>:</span>
        <input type="number" min="0" max="20" value={away} onChange={(e) => setAway(e.target.value)} className="w-16 px-3 py-2 border rounded-xl text-center" />
        <button onClick={() => onSave(match.id, home, away, false)} disabled={saving} className="px-4 py-2 bg-orendt-gray-100 rounded-xl text-xs font-bold uppercase">Live</button>
        <button onClick={() => onSave(match.id, home, away, true)} disabled={saving} className="px-4 py-2 bg-orendt-black text-white rounded-xl text-xs font-bold uppercase">Beenden</button>
      </div>
    </div>
  )
}
