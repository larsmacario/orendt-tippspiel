"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import MatchCard from "@/components/MatchCard"
import PredictionRow from "@/components/PredictionRow"
import Leaderboard from "@/components/Leaderboard"
import OnboardingModal from "@/components/OnboardingModal"
import { LiveDot } from "@/components/TeamBadge"
import { getTodayMatches, getUpcomingMatches, getMyPredictions, getMyRank, getLeaderboard, getPredictionLockMinutes, markOnboardingSeen } from "@/lib/supabase"
import { usePredictionSaveFab, PredictionSaveFab } from "@/lib/usePredictionSaveFab"
import {
  isLocked,
  getMatchdayKey,
  formatDate,
  getBerlinDayBounds,
  shouldPollTodayMatches,
  sortMatchesForToday,
} from "@/lib/dates"

const POLL_INTERVAL_MS = 45_000

export default function DashboardPage() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()
  const [todayMatches, setTodayMatches] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [predictions, setPredictions] = useState({})
  const [myRank, setMyRank] = useState(null)
  const [topThree, setTopThree] = useState([])
  const [lockMinutes, setLockMinutes] = useState(30)
  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user || dataLoading) return
    if (user.onboarding_seen === false) {
      setShowOnboarding(true)
    }
  }, [user, dataLoading])

  const handleCloseOnboarding = useCallback(async () => {
    setShowOnboarding(false)
    if (!user?.id) return
    await markOnboardingSeen(user.id)
    await refresh()
  }, [user?.id, refresh])

  const handleGoToGuideFromOnboarding = useCallback(async () => {
    setShowOnboarding(false)
    if (user?.id) {
      await markOnboardingSeen(user.id)
      await refresh()
    }
  }, [user?.id, refresh])

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!user) return
    if (silent) setRefreshing(true)

    try {
      const [todayRes, upcomingRes, predRes, rankRes, lbRes, minutes] = await Promise.all([
        getTodayMatches(),
        getUpcomingMatches(),
        getMyPredictions(user.id),
        getMyRank(user.id),
        getLeaderboard(),
        getPredictionLockMinutes(),
      ])
      setTodayMatches(todayRes.data || [])
      setUpcoming(upcomingRes.data || [])
      const predMap = {}
      predRes.data?.forEach((p) => { predMap[p.match_id] = p })
      setPredictions(predMap)
      setMyRank(rankRes)
      setTopThree((lbRes.data || []).slice(0, 3))
      setLockMinutes(minutes)
    } finally {
      if (!silent) setDataLoading(false)
      if (silent) setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const sortedTodayMatches = useMemo(
    () => sortMatchesForToday(todayMatches),
    [todayMatches]
  )

  const hasLiveGames = useMemo(
    () => sortedTodayMatches.some((m) => m.status === "live"),
    [sortedTodayMatches]
  )

  const todayLabel = useMemo(
    () => formatDate(getBerlinDayBounds().start),
    []
  )

  const shouldPoll = useMemo(
    () => shouldPollTodayMatches(sortedTodayMatches),
    [sortedTodayMatches]
  )

  useEffect(() => {
    if (!user || dataLoading || !shouldPoll) return
    const id = setInterval(() => loadData({ silent: true }), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [user, dataLoading, shouldPoll, loadData])

  const saveFab = usePredictionSaveFab({ userId: user?.id, onSaved: loadData })

  const { missingTips, matchdayLabel } = useMemo(() => {
    const tippable = upcoming.filter(
      (m) => m.status === "scheduled" && !isLocked(m.kickoff_at, lockMinutes)
    )
    if (!tippable.length) return { missingTips: [], matchdayLabel: null }

    const nextDay = getMatchdayKey(tippable[0].kickoff_at)
    const nextMatchday = tippable.filter((m) => getMatchdayKey(m.kickoff_at) === nextDay)
    const missing = nextMatchday.filter((m) => !predictions[m.id])

    return {
      missingTips: missing,
      matchdayLabel: formatDate(tippable[0].kickoff_at),
    }
  }, [upcoming, predictions, lockMinutes])

  if (loading || !user || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="dashboard" />
      <OnboardingModal
        open={showOnboarding}
        onClose={handleCloseOnboarding}
        onGoToGuide={handleGoToGuideFromOnboarding}
      />
      <main className={`flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 animate-slide-up ${saveFab.hasPending ? "pb-24" : ""}`}>
        <div className="mb-10">
          <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-orendt-gray-500 mb-3">Willkommen zurück</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-bold text-orendt-black uppercase tracking-tight">
            Hallo, {user.display_name?.split(" ")[0]}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Dein Rang" value={myRank ? `#${myRank.rank}` : "–"} />
          <StatCard label="Punkte" value={myRank?.total_points ?? 0} />
          <StatCard label="Exakte Tipps" value={myRank?.exact_hits ?? 0} />
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {hasLiveGames && <LiveDot />}
              <h2 className="font-display font-bold text-lg uppercase tracking-tight">
                {hasLiveGames ? "Heute · Live" : "Heute"}
              </h2>
            </div>
            {hasLiveGames && refreshing && (
              <span className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400 shrink-0">
                Aktualisiert…
              </span>
            )}
          </div>
          <p className="text-sm text-orendt-gray-500 mb-4">{todayLabel}</p>
          {sortedTodayMatches.length > 0 ? (
            <div className="grid gap-3">
              {sortedTodayMatches.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predictions[m.id]} userId={user.id} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6 text-sm text-orendt-gray-500">
              Heute keine Spiele.
            </div>
          )}
        </section>

        {missingTips.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-bold text-lg uppercase tracking-tight mb-1">Tipps fehlen noch</h2>
            {matchdayLabel && (
              <p className="text-sm text-orendt-gray-500 mb-4">{matchdayLabel}</p>
            )}
            <div className="grid gap-3">
              {missingTips.map((m) => (
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
        )}

        <section>
          <h2 className="font-display font-bold text-lg uppercase tracking-tight mb-4">Top 3</h2>
          <Leaderboard rows={topThree} currentUserId={user.id} compact />
        </section>
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

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 p-5">
      <p className="text-[10px] font-display font-bold uppercase tracking-wider text-orendt-gray-400 mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-orendt-black">{value}</p>
    </div>
  )
}
