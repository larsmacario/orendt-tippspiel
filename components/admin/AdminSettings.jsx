"use client"

import { useEffect, useState } from "react"
import { getSettings, updateSetting } from "@/lib/supabase"

const SETTING_LABELS = {
  points_exact: "Punkte exaktes Ergebnis",
  points_diff: "Punkte Tordifferenz",
  points_tendency: "Punkte Tendenz",
  champion_bonus: "Weltmeister-Bonus",
  prediction_lock_minutes: "Tipp-Sperre (Minuten vor Anpfiff)",
  tournament_start: "Turnierstart (ISO)",
  domain_whitelist: "Domain-Whitelist (@orendtstudios.com)",
  cron_enabled: "Cron aktiv (true/false)",
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function save(key) {
    setSaving(key)
    setMessage("")
    await updateSetting(key, settings[key])
    setSaving("")
    setMessage(`${SETTING_LABELS[key] || key} gespeichert.`)
  }

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6 space-y-4">
      <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-4">Einstellungen</h2>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {Object.entries(SETTING_LABELS).map(([key, label]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm text-orendt-gray-600 sm:w-64 shrink-0">{label}</label>
          <input
            value={settings[key] ?? ""}
            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
            className="flex-1 px-4 py-2 border border-orendt-gray-200 rounded-xl outline-none focus:border-orendt-black"
          />
          <button
            onClick={() => save(key)}
            disabled={saving === key}
            className="px-4 py-2 bg-orendt-black text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      ))}
    </div>
  )
}
