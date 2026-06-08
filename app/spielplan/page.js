"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PredictionRow from "@/components/PredictionRow"
import { getMatches, getMyPredictions, getPredictionLockMinutes } from "@/lib/supabase"
import { usePredictionSaveFab, PredictionSaveFab } from "@/lib/usePredictionSaveFab"
import { isLocked, PHASE_LABELS } from "@/lib/dates"
import {
  GROUP_CODES,
  getMatchGroupCode,
  groupSectionKey,
  compareGroupSections,
} from "@/lib/groups"

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "group", label: "Gruppenphase" },
  { id: "ko", label: "K.o.-Phase" },
  { id: "missing", label: "Tipp fehlt" },
]

export default function SpielplanPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [filter, setFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [lockMinutes, setLockMinutes] = useState(30)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  async function loadData() {
    if (!user) return
    const [matchRes, predRes, minutes] = await Promise.all([
      getMatches(),
      getMyPredictions(user.id),
      getPredictionLockMinutes(),
    ])
    setMatches(matchRes.data || [])
    setLockMinutes(minutes)
    const map = {}
    predRes.data?.forEach((p) => { map[p.match_id] = p })
    setPredictions(map)
    setDataLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const saveFab = usePredictionSaveFab({ userId: user?.id, onSaved: loadData })

  useEffect(() => {
    if (filter === "ko") setGroupFilter("all")
  }, [filter])

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "group" && m.phase !== "group") return false
      if (filter === "ko" && m.phase === "group") return false
      if (filter === "missing" && (predictions[m.id] || isLocked(m.kickoff_at, lockMinutes))) return false
      if (groupFilter !== "all" && getMatchGroupCode(m) !== groupFilter) return false
      return true
    })
  }, [matches, filter, groupFilter, predictions, lockMinutes])

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach((m) => {
      const key =
        m.phase === "group"
          ? groupSectionKey(m)
          : (PHASE_LABELS[m.phase] || m.phase)
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return Object.entries(groups).sort(compareGroupSections)
  }, [filtered])

  const showGroupFilters = filter === "all" || filter === "group" || filter === "missing"

  if (loading || !user || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="spielplan" />
      <main className={`flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 ${saveFab.hasPending ? "pb-24" : ""}`}>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-6">Spielplan</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                filter === f.id ? "bg-orendt-black text-white" : "bg-white border border-orendt-gray-200 text-orendt-gray-500 hover:text-orendt-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {showGroupFilters && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-8 pb-1">
            <button
              onClick={() => setGroupFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                groupFilter === "all" ? "bg-orendt-gray-800 text-white" : "bg-white border border-orendt-gray-200 text-orendt-gray-400 hover:text-orendt-black"
              }`}
            >
              Alle Gruppen
            </button>
            {GROUP_CODES.map((code) => (
              <button
                key={code}
                onClick={() => setGroupFilter(code)}
                className={`min-w-[2.25rem] px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
                  groupFilter === code ? "bg-orendt-gray-800 text-white" : "bg-white border border-orendt-gray-200 text-orendt-gray-400 hover:text-orendt-black"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        )}
        {!showGroupFilters && <div className="mb-8" />}
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl border border-orendt-gray-200 p-10 text-center text-orendt-gray-500">
            Keine Spiele für diesen Filter.
          </div>
        ) : (
          grouped.map(([group, items]) => (
            <section key={group} className="mb-10">
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-orendt-gray-500 mb-4">{group}</h2>
              <div className="grid gap-4 animate-stagger">
                {items.map((m) => (
                  <PredictionRow
                    key={m.id}
                    match={m}
                    prediction={predictions[m.id]}
                    userId={user.id}
                    onSaved={loadData}
                    onDirtyChange={saveFab.registerDirtyChange}
                    batchSaving={saveFab.saving}
                    lockMinutes={lockMinutes}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
      <PredictionSaveFab
        hasPending={saveFab.hasPending}
        pendingCount={saveFab.pendingCount}
        saveAll={saveFab.saveAll}
        saving={saveFab.saving}
        error={saveFab.error}
      />
      <Footer />
    </div>
  )
}
