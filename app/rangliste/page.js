"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import KicktippLeaderboard from "@/components/KicktippLeaderboard"
import { getKicktippLeaderboardData } from "@/lib/supabase"

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
        <p className="text-sm text-orendt-gray-500 mb-8">
          Letzte 5 Spiele · +/- seit letztem abgeschlossenen Spieltag
          {data?.snapshotMatchday ? ` (${data.snapshotMatchday})` : ""}
        </p>
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
