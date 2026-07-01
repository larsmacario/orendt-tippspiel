"use client"

import { useEffect } from "react"
import { Scale, Info } from "lucide-react"

const POINTS = [
  {
    title: "Remis: 2 oder 4 Punkte",
    text: "Bei Unentschieden gibt es keine Tordifferenz-Punkte (kein 3). Richtige Remis-Tendenz bringt 2 Punkte, exakt getippt 4 — z. B. Tipp 1:1, Ergebnis 2:2.",
  },
  {
    title: "Siege: 2, 3 oder 4 Punkte",
    text: "Bei Heim- oder Auswärtssieg gilt: 2 für Tendenz, 3 für Tordifferenz, 4 für exakt — z. B. Tipp 1:0, Ergebnis 2:0.",
  },
  {
    title: "Tipps neu berechnet",
    text: "Alle abgeschlossenen Spiele wurden mit der aktualisierten Regel neu gewertet. Dein Punktestand und dein Rang können sich geändert haben.",
  },
  {
    title: "K.o.-Sieger zählt für die Tendenz",
    text: "4 Punkte (exakt) und 3 Punkte (Tordifferenz) beziehen sich auf 90 Minuten. Bei einem Remis zählt der Sieger im Elfmeterschießen für 2 Tendenzpunkte.",
  },
]

export default function ScoringNoticeModal({ open, onConfirm }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scoring-notice-title"
    >
      <div className="absolute inset-0 bg-orendt-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-orendt-gray-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-scale-in motion-reduce:animate-none">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-orendt-accent/20 border border-orendt-accent/40 flex items-center justify-center text-orendt-black">
              <Scale className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-orendt-gray-400 mb-1">
                Wichtige Info
              </p>
              <h2
                id="scoring-notice-title"
                className="font-display text-xl sm:text-2xl font-bold text-orendt-black uppercase tracking-tight"
              >
                Punkte-Anpassung
              </h2>
            </div>
          </div>

          <p className="text-sm text-orendt-gray-600 leading-relaxed mb-6">
            Das Punktesystem wurde angepasst — besonders bei Unentschieden.
            Alle bisherigen Tipps wurden neu berechnet. Kurz zusammengefasst:
          </p>

          <ul className="space-y-3 mb-6">
            {POINTS.map((point) => (
              <li
                key={point.title}
                className="flex gap-3 p-3 rounded-xl bg-orendt-gray-50 border border-orendt-gray-100"
              >
                <Info className="w-4 h-4 text-orendt-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-display font-bold text-sm text-orendt-black mb-0.5">{point.title}</p>
                  <p className="text-xs text-orendt-gray-600 leading-relaxed">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-4 bg-orendt-black text-white font-display font-bold text-xs uppercase tracking-[0.25em] rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Habe ich verstanden
          </button>
        </div>
      </div>
    </div>
  )
}
