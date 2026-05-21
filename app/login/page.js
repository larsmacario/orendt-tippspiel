"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Footer from "@/components/Footer"
import {
  supabase,
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  updatePassword,
  markPasswordChanged,
  requestPasswordReset,
  getSettings,
  activateProfile,
  assertSupabaseConfigured,
} from "@/lib/supabase"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false)
  const [isOtpResetMode, setIsOtpResetMode] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpNewPassword, setOtpNewPassword] = useState("")
  const [otpConfirmPassword, setOtpConfirmPassword] = useState("")
  const router = useRouter()

  async function triggerOtpReset(normalizedEmail) {
    const redirectTo = `${window.location.origin}/login`
    const { error: resetError } = await requestPasswordReset(normalizedEmail, redirectTo)
    if (resetError) throw resetError
    setIsForgotPasswordMode(true)
    setIsOtpResetMode(true)
    setSuccessMessage("Wenn ein Konto existiert, wurde ein Sicherheitscode versendet.")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isForgotPasswordMode) {
      if (isOtpResetMode) await handleOtpPasswordReset()
      else await handleForgotPassword()
      return
    }

    setError("")
    setSuccessMessage("")
    setLoading(true)

    try {
      assertSupabaseConfigured()
      if (isSignUp) {
        const settings = await getSettings()
        const whitelist = (settings.domain_whitelist || "").trim()
        if (whitelist) {
          const domain = email.trim().toLowerCase().split("@")[1]
          const allowed = whitelist.split(",").map((d) => d.trim().replace(/^@/, "").toLowerCase()).filter(Boolean)
          if (!allowed.includes(domain)) {
            throw new Error(`Registrierung nur mit ${allowed.map((d) => "@" + d).join(", ")} erlaubt.`)
          }
        }

        const { data, error: err } = await signUp(email, password, displayName)
        if (err) throw err
        if (data?.session) {
          const profile = await getCurrentUser()
          if (profile && !profile.is_active) {
            await activateProfile(profile.id)
          }
          router.push("/dashboard")
        } else setSuccessMessage("Registrierung erfolgreich! Bitte bestätige deine E-Mail.")
      } else {
        const { error: err } = await signIn(email, password)
        if (err) throw err
        const profile = await getCurrentUser()
        if (profile?.is_blocked) {
          await signOut()
          throw new Error("Dein Account wurde gesperrt.")
        }
        if (profile?.must_change_password) {
          await triggerOtpReset(email.trim().toLowerCase())
          setLoading(false)
          return
        }
        if (!profile?.is_active) {
          await activateProfile(profile.id)
        }
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError("")
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError("Bitte gib deine E-Mail-Adresse ein.")
      return
    }
    setLoading(true)
    try {
      assertSupabaseConfigured()
      await triggerOtpReset(normalizedEmail)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpPasswordReset() {
    setError("")
    const normalizedEmail = email.trim().toLowerCase()
    if (!otpCode.trim() || otpNewPassword.length < 6 || otpNewPassword !== otpConfirmPassword) {
      setError("Bitte alle Felder korrekt ausfüllen.")
      return
    }
    setLoading(true)
    try {
      assertSupabaseConfigured()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpCode.trim(),
        type: "recovery",
      })
      if (verifyError) throw verifyError
      const { error: pwError } = await updatePassword(otpNewPassword)
      if (pwError) throw pwError
      const updatedProfile = await getCurrentUser()
      if (updatedProfile?.must_change_password) {
        await markPasswordChanged(updatedProfile.id)
      }
      if (updatedProfile && !updatedProfile.is_active) {
        await activateProfile(updatedProfile.id)
      }
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "Code ungültig oder abgelaufen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orendt-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full border-b border-orendt-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="h-10 px-4 py-2 bg-orendt-black rounded-xl flex items-center justify-center">
            <img src="/orendtstudios_logo.png" alt="Orendt Studios" className="h-full w-auto object-contain" />
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="font-display text-[32px] sm:text-[42px] font-bold text-orendt-black mb-3 tracking-tighter">
              WM Tipprunde
            </h1>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-orendt-gray-400">
              FIFA WM 2026 · Orendt Studios
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-orendt-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="block text-[10px] font-display font-bold text-orendt-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Max Mustermann"
                    required
                    className="w-full px-5 py-3.5 bg-orendt-gray-50 border border-orendt-gray-100 rounded-2xl text-orendt-black focus:border-orendt-black outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-display font-bold text-orendt-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@orendtstudios.com"
                  required
                  className="w-full px-5 py-3.5 bg-orendt-gray-50 border border-orendt-gray-100 rounded-2xl text-orendt-black focus:border-orendt-black outline-none"
                />
              </div>
              {!isForgotPasswordMode && (
                <div>
                  <label className="block text-[10px] font-display font-bold text-orendt-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Passwort</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isForgotPasswordMode}
                    minLength={6}
                    className="w-full px-5 py-3.5 bg-orendt-gray-50 border border-orendt-gray-100 rounded-2xl text-orendt-black focus:border-orendt-black outline-none"
                  />
                </div>
              )}
              {isForgotPasswordMode && isOtpResetMode && (
                <>
                  <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Sicherheitscode" required className="w-full px-5 py-3.5 bg-orendt-gray-50 border rounded-2xl outline-none" />
                  <input type="password" value={otpNewPassword} onChange={(e) => setOtpNewPassword(e.target.value)} placeholder="Neues Passwort" required minLength={6} className="w-full px-5 py-3.5 bg-orendt-gray-50 border rounded-2xl outline-none" />
                  <input type="password" value={otpConfirmPassword} onChange={(e) => setOtpConfirmPassword(e.target.value)} placeholder="Passwort bestätigen" required className="w-full px-5 py-3.5 bg-orendt-gray-50 border rounded-2xl outline-none" />
                </>
              )}
              {isSignUp && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} required className="mt-1" />
                  <span className="text-xs text-orendt-gray-500">
                    Ich habe die <Link href="/datenschutz" className="underline font-semibold">Datenschutzerklärung</Link> gelesen.
                  </span>
                </label>
              )}
              {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{error}</div>}
              {successMessage && <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm">{successMessage}</div>}
              {!isSignUp && !isForgotPasswordMode && (
                <button type="button" onClick={() => { setIsForgotPasswordMode(true); setIsOtpResetMode(false) }} className="w-full text-right text-[11px] font-display font-bold uppercase text-orendt-gray-400 hover:text-orendt-black">
                  Passwort vergessen?
                </button>
              )}
              {isForgotPasswordMode && (
                <button type="button" onClick={() => { setIsForgotPasswordMode(false); setIsOtpResetMode(false) }} className="w-full text-right text-[11px] font-display font-bold uppercase text-orendt-gray-400">
                  Zurück zum Login
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (isSignUp && !privacyAccepted)}
                className="w-full py-4 bg-orendt-black text-white font-display font-bold text-xs uppercase tracking-[0.25em] rounded-2xl hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Bitte warten…" : isForgotPasswordMode ? (isOtpResetMode ? "Passwort zurücksetzen" : "Code senden") : isSignUp ? "Konto erstellen" : "Anmelden"}
              </button>
            </form>
            <div className="mt-8 text-center border-t border-orendt-gray-50 pt-6">
              <button onClick={() => { setIsSignUp(!isSignUp); setError("") }} disabled={isForgotPasswordMode} className="text-orendt-gray-400 hover:text-orendt-black text-[11px] font-display font-bold uppercase tracking-[0.3em]">
                {isSignUp ? "Bereits registriert?" : "Neu hier? Registrieren"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
