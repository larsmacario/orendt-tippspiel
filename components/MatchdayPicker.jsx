"use client"

import { CalendarDays, ChevronDown } from "lucide-react"
import { getBerlinTodayKey } from "@/lib/dates"

function optionLabel({ key, label }, todayKey) {
  if (key === todayKey) return "Heute"
  return label
}

export default function MatchdayPicker({ value, options, onChange, className = "" }) {
  if (!options?.length) return null

  const todayKey = getBerlinTodayKey()
  const selectedLabel =
    value === "all"
      ? "Alle Spieltage"
      : optionLabel(options.find((o) => o.key === value) || { key: value, label: value }, todayKey)

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor="matchday-picker">
        Spieltag wählen
      </label>
      <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-orendt-gray-400">
        <CalendarDays size={16} strokeWidth={2.25} aria-hidden="true" />
      </div>
      <select
        id="matchday-picker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-orendt-gray-200 bg-white py-2 pl-9 pr-9 font-display text-[11px] font-bold uppercase tracking-wider text-orendt-black outline-none transition-colors hover:border-orendt-gray-300 focus:border-orendt-black cursor-pointer"
      >
        <option value="all">Alle Spieltage</option>
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {optionLabel(opt, todayKey)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-orendt-gray-400">
        <ChevronDown size={16} strokeWidth={2.25} aria-hidden="true" />
      </div>
      <span className="sr-only" aria-live="polite">
        Ausgewählt: {selectedLabel}
      </span>
    </div>
  )
}
