"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Leaderboard from "@/components/Leaderboard"
import { getLeaderboard } from "@/lib/supabase"

export default function RanglistePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getLeaderboard().then(({ data }) => {
      setRows(data || [])
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Rangliste</h1>
        <p className="text-sm text-orendt-gray-500 mb-8">Sortiert nach Punkten, Tiebreaker: exakte Ergebnisse, dann Tordifferenz-Treffer.</p>
        <Leaderboard rows={rows} currentUserId={user.id} />
      </main>
      <Footer />
    </div>
  )
}
