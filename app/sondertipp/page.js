"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { TeamBadge } from "@/components/TeamBadge"
import {
  getTeams,
  getChampionPrediction,
  upsertChampionPrediction,
  isTournamentStarted,
  getSettings,
} from "@/lib/supabase"

export default function SondertippPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [search, setSearch] = useState("")
  const [locked, setLocked] = useState(false)
  const [bonus, setBonus] = useState(25)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function load() {
      const [teamsRes, predRes, started, settings] = await Promise.all([
        getTeams(),
        getChampionPrediction(user.id),
        isTournamentStarted(),
        getSettings(),
      ])
      setTeams(teamsRes.data || [])
      setPrediction(predRes.data)
      setLocked(started || !!predRes.data)
      setBonus(parseInt(settings.champion_bonus || "25", 10))
      setDataLoading(false)
    }
    load()
  }, [user])

  async function selectTeam(teamId) {
    if (locked || saving) return
    setSaving(true)
    setError("")
    const { data, error: err } = await upsertChampionPrediction(user.id, teamId)
    setSaving(false)
    if (err) setError(err.message)
    else {
      setPrediction(data)
      setLocked(true)
    }
  }

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading || !user || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="sondertipp" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Weltmeister-Tipp</h1>
        <p className="text-sm text-orendt-gray-500 mb-8">
          Wähle deinen WM-Sieger vor Turnierstart. Richtig getippt: +{bonus} Bonuspunkte.
        </p>

        {prediction && (
          <div className="bg-white rounded-2xl border border-orendt-accent p-6 mb-8 flex items-center gap-4">
            <TeamBadge team={prediction.team} size={48} />
            <div>
              <p className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400">Dein Tipp</p>
              <p className="font-display font-bold text-xl text-orendt-black">{prediction.team?.name}</p>
            </div>
          </div>
        )}

        {locked && !prediction && (
          <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6 mb-8 text-orendt-gray-500">
            Das Turnier hat begonnen – Sondertipp ist gesperrt.
          </div>
        )}

        {!locked && (
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Team suchen…"
              className="w-full px-5 py-3.5 bg-white border border-orendt-gray-200 rounded-2xl mb-6 outline-none focus:border-orendt-black"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team.id)}
                  disabled={saving}
                  className="bg-white rounded-2xl border border-orendt-gray-200 p-4 flex flex-col items-center gap-2 hover:border-orendt-black transition-colors disabled:opacity-50"
                >
                  <TeamBadge team={team} size={40} />
                  <span className="font-display font-bold text-xs text-center">{team.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </main>
      <Footer />
    </div>
  )
}
