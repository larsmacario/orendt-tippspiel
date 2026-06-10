"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Target, Star, Trophy, X } from "lucide-react"

const KEY_POINTS = [
  {
    icon: Target,
    title: "Spielergebnisse tippen",
    text: "Gib deine Tipps im Dashboard oder Spielplan ab und sammle Punkte nach dem Kicker-System.",
  },
  {
    icon: Star,
    title: "Weltmeister wählen",
    text: "Tippe deinen Favoriten für 25 Bonuspunkte — unter Sondertipp, bis zum Turnierstart änderbar.",
  },
  {
    icon: Trophy,
    title: "4 / 3 / 2 / 0 Punkte",
    text: "Exakt, richtige Tordifferenz, richtige Tendenz oder kein Punkt — so wird gewertet.",
  },
]

export default function OnboardingModal({ open, onClose, onGoToGuide }) {
  const router = useRouter()

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const handleGoToGuide = useCallback(() => {
    onGoToGuide?.()
    router.push("/anleitung")
  }, [onGoToGuide, router])

  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === "Escape") handleClose()
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-orendt-black/60 backdrop-blur-sm cursor-pointer"
        aria-label="Dialog schließen"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl border border-orendt-gray-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-scale-in motion-reduce:animate-none">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-orendt-gray-400 hover:text-orendt-black rounded-xl hover:bg-orendt-gray-100 transition-colors cursor-pointer"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="p-6 sm:p-8">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-orendt-gray-400 mb-2">
            Willkommen
          </p>
          <h2
            id="onboarding-title"
            className="font-display text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6 pr-8"
          >
            WM Tipprunde 2026
          </h2>

          <ul className="space-y-3 mb-8">
            {KEY_POINTS.map((point) => {
              const Icon = point.icon
              return (
                <li
                  key={point.title}
                  className="flex gap-3 p-3 rounded-xl bg-orendt-gray-50 border border-orendt-gray-100"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-orendt-gray-200 flex items-center justify-center text-orendt-black">
                    <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-orendt-black mb-0.5">{point.title}</p>
                    <p className="text-xs text-orendt-gray-600 leading-relaxed">{point.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-4 bg-orendt-black text-white font-display font-bold text-xs uppercase tracking-[0.25em] rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Los geht&apos;s
            </button>
            <button
              type="button"
              onClick={handleGoToGuide}
              className="w-full py-3 text-orendt-gray-500 hover:text-orendt-black font-display font-bold text-[11px] uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              Zur Anleitung
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
