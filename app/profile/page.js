"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { updateProfile, updatePassword } from "@/lib/supabase"

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [participationSaving, setParticipationSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
    if (user) {
      setDisplayName(user.display_name || "")
      setIsActive(user.is_active === true)
    }
  }, [user, loading, router])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")
    const { error: err } = await updateProfile(user.id, { display_name: displayName })
    setSaving(false)
    if (err) setError(err.message)
    else {
      setMessage("Profil gespeichert.")
      refresh()
    }
  }

  async function toggleParticipation() {
    const nextActive = !isActive
    setParticipationSaving(true)
    setError("")
    setMessage("")
    const { error: err } = await updateProfile(user.id, { is_active: nextActive })
    setParticipationSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setIsActive(nextActive)
    setMessage(nextActive ? "Du nimmst wieder am Tippspiel teil." : "Teilnahme pausiert. Du wirst aus der Rangliste und allen öffentlichen Ansichten entfernt.")
    refresh()
  }

  async function savePassword(e) {
    e.preventDefault()
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein (min. 6 Zeichen).")
      return
    }
    setSaving(true)
    setError("")
    const { error: err } = await updatePassword(newPassword)
    setSaving(false)
    if (err) setError(err.message)
    else {
      setMessage("Passwort geändert.")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="profile" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-8">Profil</h1>
        {message && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm">{message}</div>}
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{error}</div>}

        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-orendt-gray-200 p-6 mb-6 space-y-4">
          <h2 className="font-display font-bold uppercase tracking-wider text-sm">Anzeigename</h2>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-orendt-gray-50 border border-orendt-gray-200 rounded-xl outline-none focus:border-orendt-black"
          />
          <p className="text-xs text-orendt-gray-400">E-Mail: {user.email}</p>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-orendt-black text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50">
            Speichern
          </button>
        </form>

        <form onSubmit={savePassword} className="bg-white rounded-2xl border border-orendt-gray-200 p-6 space-y-4 mb-6">
          <h2 className="font-display font-bold uppercase tracking-wider text-sm">Passwort ändern</h2>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Neues Passwort" className="w-full px-4 py-3 bg-orendt-gray-50 border rounded-xl outline-none" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Bestätigen" className="w-full px-4 py-3 bg-orendt-gray-50 border rounded-xl outline-none" />
          <button type="submit" disabled={saving} className="px-6 py-3 bg-orendt-black text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50">
            Passwort ändern
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6 space-y-4">
          <h2 className="font-display font-bold uppercase tracking-wider text-sm">Tippspiel-Teilnahme</h2>
          <p className="text-sm text-orendt-gray-500">
            {isActive
              ? "Du bist sichtbar in der Rangliste und nimmst am Tippspiel teil."
              : "Du bist derzeit ausgeblendet. Aktiviere die Teilnahme, um wieder sichtbar zu sein."}
          </p>
          {!isActive && (
            <p className="text-xs text-orendt-gray-400">
              Bei Deaktivierung wirst du aus der Rangliste und allen öffentlichen Ansichten entfernt. Du kannst dich weiterhin anmelden und tippen.
            </p>
          )}
          <button
            type="button"
            onClick={toggleParticipation}
            disabled={participationSaving}
            className={`px-6 py-3 font-display font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 ${
              isActive ? "bg-orendt-gray-100 text-orendt-black border border-orendt-gray-200" : "bg-orendt-black text-white"
            }`}
          >
            {participationSaving ? "Bitte warten…" : isActive ? "Teilnahme pausieren" : "Teilnahme aktivieren"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
