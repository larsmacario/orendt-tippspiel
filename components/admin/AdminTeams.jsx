"use client"

import { useEffect, useState } from "react"
import { getTeams } from "@/lib/supabase"
import { TeamBadge } from "@/components/TeamBadge"

export default function AdminTeams() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    getTeams().then(({ data }) => setTeams(data || []))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-orendt-gray-200">
        <h2 className="font-display font-bold uppercase tracking-wider text-sm">Teams ({teams.length})</h2>
      </div>
      {teams.length === 0 ? (
        <p className="p-6 text-orendt-gray-500 text-sm">Noch keine Teams. Starte den Team-Import unter Sync.</p>
      ) : (
        <div className="divide-y divide-orendt-gray-100">
          {teams.map((team) => (
            <div key={team.id} className="px-6 py-4 flex items-center gap-4">
              <TeamBadge team={team} size={32} />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm">{team.name}</p>
                <p className="text-xs text-orendt-gray-400">{team.code} · Gruppe {team.group_code || "–"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
