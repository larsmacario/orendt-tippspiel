"use client"

import { useEffect, useState } from "react"
import { getProfiles, updateProfile } from "@/lib/supabase"

export default function AdminUsers() {
  const [users, setUsers] = useState([])

  async function load() {
    const { data } = await getProfiles()
    setUsers(data || [])
  }

  useEffect(() => { load() }, [])

  async function toggleRole(user) {
    const newRole = user.role === "admin" ? "player" : "admin"
    await updateProfile(user.id, { role: newRole })
    load()
  }

  async function toggleBlock(user) {
    await updateProfile(user.id, { is_blocked: !user.is_blocked })
    load()
  }

  async function toggleActive(user) {
    await updateProfile(user.id, { is_active: !user.is_active })
    load()
  }

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="font-display font-bold uppercase tracking-wider text-sm">Nutzer ({users.length})</h2>
      </div>
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {users.map((u) => (
          <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold text-sm">{u.display_name}</p>
              <p className="text-xs text-orendt-gray-400">
                {u.email} · {u.role}
                {u.is_blocked ? " · gesperrt" : ""}
                {u.is_active ? " · aktiv" : " · inaktiv"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => toggleRole(u)} className="px-3 py-1.5 border rounded-lg text-xs font-bold uppercase">
                {u.role === "admin" ? "→ Spieler" : "→ Admin"}
              </button>
              <button
                onClick={() => toggleActive(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${u.is_active ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}
              >
                {u.is_active ? "Deaktivieren" : "Aktivieren"}
              </button>
              <button onClick={() => toggleBlock(u)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${u.is_blocked ? "bg-green-100" : "bg-red-50"}`}>
                {u.is_blocked ? "Entsperren" : "Sperren"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
