"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import KicktippLeaderboard from "@/components/KicktippLeaderboard"
import { getKicktippLeaderboardData } from "@/lib/supabase"
import { formatRankDeltaCaption, formatRankDeltaHint } from "@/lib/leaderboard-matrix"

export default function RanglistePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getKicktippLeaderboardData().then(({ data: payload, error: err }) => {
      if (err) setError(err.message || "Rangliste konnte nicht geladen werden.")
      else setData(payload)
      setDataLoading(false)
    })
  }, [user])

  if (loading || !user || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="rangliste" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Rangliste</h1>
        <div className="text-sm text-orendt-gray-500 mb-8 space-y-1">
          <p>
            Die Spalten zeigen die <strong className="text-orendt-black font-medium">5 zuletzt beendeten Spiele</strong>.
            Spalte <strong className="text-orendt-black font-medium">P</strong> summiert nur diese 5 Spiele.
          </p>
          <p>
            {data?.snapshotMatchday
              ? formatRankDeltaHint(data.snapshotMatchday)
              : "Platzänderung (+/-) im letzten abgeschlossenen Spieltag — unabhängig von den 5 Spielspalten."}
          </p>
          {data?.snapshotMatchday && (
            <p className="text-xs text-orendt-gray-400">
              {formatRankDeltaCaption(data.snapshotMatchday)} (Referenz: {data.snapshotMatchday})
            </p>
          )}
        </div>
        {error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-600 text-sm">{error}</div>
        ) : (
          <KicktippLeaderboard data={data} currentUserId={user.id} />
        )}
      </main>
      <Footer />
    </div>
  )
}
