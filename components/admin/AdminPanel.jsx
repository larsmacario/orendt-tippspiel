"use client"

import { useState } from "react"
import AdminTeams from "./AdminTeams"
import AdminMatches from "./AdminMatches"
import AdminResults from "./AdminResults"
import AdminSync from "./AdminSync"
import AdminUsers from "./AdminUsers"
import AdminSettings from "./AdminSettings"

const TABS = [
  { id: "sync", label: "Sync" },
  { id: "teams", label: "Teams" },
  { id: "spielplan", label: "Spielplan" },
  { id: "results", label: "Ergebnisse" },
  { id: "users", label: "Nutzer" },
  { id: "settings", label: "Einstellungen" },
]

export default function AdminPanel() {
  const [tab, setTab] = useState("sync")

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-6">Admin</h1>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 border-b border-orendt-gray-200 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[12px] font-display font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "text-orendt-black border-orendt-black" : "text-orendt-gray-400 border-transparent hover:text-orendt-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "sync" && <AdminSync />}
      {tab === "teams" && <AdminTeams />}
      {tab === "spielplan" && <AdminMatches />}
      {tab === "results" && <AdminResults />}
      {tab === "users" && <AdminUsers />}
      {tab === "settings" && <AdminSettings />}
    </div>
  )
}
