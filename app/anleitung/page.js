"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import {
  BookOpen,
  Trophy,
  Target,
  Clock,
  Star,
  ListOrdered,
  ChevronRight,
  Eye,
} from "lucide-react"

const SECTIONS = [
  { id: "ueberblick", label: "So funktioniert's" },
  { id: "punkte", label: "Punktesystem" },
  { id: "tippen", label: "Tipp abgeben" },
  { id: "deadlines", label: "Deadlines" },
  { id: "tippsichtbarkeit", label: "Tippsichtbarkeit" },
  { id: "sondertipp", label: "Sondertipp" },
  { id: "rangliste", label: "Rangliste" },
]

const SCORING_ROWS = [
  { points: "4", label: "Exaktes Ergebnis", example: "Tipp 2:1, Ergebnis 2:1", accent: true },
  { points: "3", label: "Richtige Tordifferenz", example: "Tipp 3:1, Ergebnis 2:0 (Diff +2)" },
  { points: "2", label: "Richtige Tendenz", example: "Tipp 1:0, Ergebnis 3:2 (Heimsieg)" },
  { points: "0", label: "Falscher Tipp", example: "Tipp 2:1, Ergebnis 0:1" },
]

const STEPS = [
  { step: "1", title: "Dashboard oder Spielplan öffnen", text: "Unter Dashboard siehst du fehlende Tipps. Im Spielplan findest du alle Spiele mit Filtern." },
  { step: "2", title: "Ergebnis eingeben", text: "Trage Heim- und Auswärtstore ein. Bestätige deinen Tipp mit dem Speichern-Button unten." },
  { step: "3", title: "Bis zur Deadline ändern", text: "Tipps kannst du zurücksetzen und neu eingeben, solange die Tipp-Sperre noch nicht aktiv ist." },
  { step: "4", title: "Punkte sammeln", text: "Nach Abpfiff werden deine Punkte automatisch berechnet und in der Rangliste verbucht." },
]

function SectionCard({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 bg-white rounded-2xl border border-orendt-gray-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-orendt-gray-50 border border-orendt-gray-200 flex items-center justify-center text-orendt-black">
          <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-orendt-black uppercase tracking-tight pt-1.5">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export default function AnleitungPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
      <Header user={user} currentPage="anleitung" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 animate-slide-up">
        <div className="mb-10">
          <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-orendt-gray-500 mb-3">
            Hilfe & Regeln
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-bold text-orendt-black uppercase tracking-tight mb-3">
            Anleitung
          </h1>
          <p className="text-orendt-gray-600 max-w-2xl leading-relaxed">
            Alles, was du über die WM Tipprunde wissen musst: Tippen, Punkte, Deadlines und der Sondertipp.
          </p>
        </div>

        <nav
          aria-label="Anleitungsabschnitte"
          className="mb-10 flex flex-wrap gap-2"
        >
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-orendt-gray-200 text-[11px] font-display font-bold uppercase tracking-wider text-orendt-gray-600 hover:text-orendt-black hover:border-orendt-gray-300 transition-colors cursor-pointer"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="space-y-6 animate-stagger">
          <SectionCard id="ueberblick" icon={BookOpen} title="So funktioniert's">
            <p className="text-orendt-gray-600 leading-relaxed mb-6">
              Die WM Tipprunde ist das interne Tippspiel von Orendt Studios für die FIFA WM 2026.
              Du tippst auf Spielergebnisse, sammelst Punkte und kämpfst um den Spitzenplatz in der Rangliste.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "Tippen", text: "Ergebnisse für Spiele der Gruppen- und K.o.-Phase abgeben" },
                { title: "Punkte", text: "Bis zu 4 Punkte pro Spiel nach Kicker-System" },
                { title: "Rangliste", text: "Vergleich mit allen aktiven Kolleg:innen" },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-orendt-gray-50 border border-orendt-gray-100">
                  <p className="font-display font-bold text-sm uppercase tracking-tight text-orendt-black mb-1">{item.title}</p>
                  <p className="text-sm text-orendt-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="punkte" icon={Target} title="Punktesystem">
            <p className="text-orendt-gray-600 leading-relaxed mb-6">
              Wir nutzen das bewährte Kicker-Punktesystem. Pro Spiel kannst du maximal 4 Punkte erhalten.
            </p>
            <div className="overflow-x-auto rounded-xl border border-orendt-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orendt-gray-50 border-b border-orendt-gray-200">
                    <th className="text-left px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-orendt-gray-500">Punkte</th>
                    <th className="text-left px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-orendt-gray-500">Kriterium</th>
                    <th className="text-left px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-orendt-gray-500 hidden sm:table-cell">Beispiel</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORING_ROWS.map((row) => (
                    <tr key={row.points} className="border-b border-orendt-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-display font-bold text-sm ${row.accent ? "bg-orendt-accent text-orendt-black" : "bg-orendt-gray-100 text-orendt-black"}`}>
                          {row.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-orendt-black">{row.label}</td>
                      <td className="px-4 py-3 text-orendt-gray-500 hidden sm:table-cell">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard id="tippen" icon={ChevronRight} title="Tipp abgeben">
            <div className="space-y-4">
              {STEPS.map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orendt-black text-white font-display font-bold text-sm flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-display font-bold text-orendt-black mb-1">{item.title}</p>
                    <p className="text-sm text-orendt-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="deadlines" icon={Clock} title="Deadlines">
            <p className="text-orendt-gray-600 leading-relaxed mb-4">
              Tipps sind bis kurz vor Anpfiff möglich. Standardmäßig gilt eine Sperre von{" "}
              <strong className="text-orendt-black">30 Minuten vor Kickoff</strong> — konfigurierbar durch den Admin.
            </p>
            <ul className="space-y-3 text-sm text-orendt-gray-600">
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Nach Ablauf der Deadline kann kein Tipp mehr abgegeben oder geändert werden.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Die Sperre wird serverseitig durchgesetzt — auch bei langsamer Verbindung.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Im Dashboard siehst du offene Tipps für den nächsten Spieltag.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="tippsichtbarkeit" icon={Eye} title="Tippsichtbarkeit">
            <p className="text-orendt-gray-600 leading-relaxed mb-4">
              Wie bei Kicktipp siehst du ab Anpfiff die Tipps aller Mitspieler — und nach Spielende, wer wie viele Punkte bekommen hat.
            </p>
            <ul className="space-y-3 text-sm text-orendt-gray-600">
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Vor Anpfiff sind nur deine eigenen Tipps sichtbar. Fremde Tipps bleiben verborgen.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Ab Anpfiff kannst du im Spielplan und Dashboard über „Alle Tipps“ die Tipps aller aktiven Spieler einsehen.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Nach Spielende zeigt die Tabelle zusätzlich die Punkte pro Spieler. Deine eigene Zeile ist hervorgehoben.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Ab Anpfiff erscheint dein eigener Tipp als feste Zeile direkt unter jedem Spiel — zusätzlich in „Alle Tipps“.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Dein eigener Tipp bleibt auch nach Spielende sichtbar — neben dem Endergebnis und deinen Punkten.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="sondertipp" icon={Star} title="Sondertipp">
            <p className="text-orendt-gray-600 leading-relaxed mb-4">
              Zusätzlich zu den Einzelspiel-Tipps kannst du einmalig deinen{" "}
              <strong className="text-orendt-black">Weltmeister-Favoriten</strong> tippen.
            </p>
            <div className="p-4 rounded-xl bg-orendt-accent/15 border border-orendt-accent/30 mb-4">
              <p className="font-display font-bold text-orendt-black mb-1">25 Bonuspunkte</p>
              <p className="text-sm text-orendt-gray-700">
                Liegt dein Tipp richtig, erhältst du 25 Extra-Punkte — unabhängig vom Spiel-Punktesystem.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-orendt-gray-600">
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Der Sondertipp ist unter „Sondertipp“ in der Navigation erreichbar.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Bis zum Turnierstart kannst du deinen Weltmeister-Tipp jederzeit ändern.
              </li>
              <li className="flex gap-2">
                <span className="text-orendt-accent font-bold">•</span>
                Ab Turnierstart ist der Tipp endgültig gesperrt.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="rangliste" icon={ListOrdered} title="Rangliste">
            <p className="text-orendt-gray-600 leading-relaxed mb-4">
              In der Rangliste siehst du alle aktiven Teilnehmer:innen sortiert nach Gesamtpunkten.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-orendt-gray-50 border border-orendt-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-orendt-black" aria-hidden="true" />
                  <p className="font-display font-bold text-sm uppercase tracking-tight">Sortierung</p>
                </div>
                <p className="text-sm text-orendt-gray-600">
                  Primär nach Gesamtpunkten, bei Gleichstand nach exakten Treffern, dann Tordifferenz-Treffern.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orendt-gray-50 border border-orendt-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orendt-black" aria-hidden="true" />
                  <p className="font-display font-bold text-sm uppercase tracking-tight">Teilnahme</p>
                </div>
                <p className="text-sm text-orendt-gray-600">
                  Nur aktive Spieler erscheinen in der Rangliste. Die Teilnahme kannst du im Profil ein- oder ausschalten.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
      <Footer />
    </div>
  )
}
