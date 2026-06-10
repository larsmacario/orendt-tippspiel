import Image from "next/image"

export function TeamBadge({ team, size = 32 }) {
  if (!team) return <div className="rounded-full bg-orendt-gray-200" style={{ width: size, height: size }} />
  if (team.badge_url) {
    return (
      <Image
        src={team.badge_url}
        alt={team.name}
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
    )
  }
  return (
    <div
      className="rounded-full bg-orendt-gray-100 flex items-center justify-center text-sm font-bold"
      style={{ width: size, height: size }}
    >
      {team.flag_emoji || team.code?.slice(0, 2) || "?"}
    </div>
  )
}

export function StatusBadge({ status }) {
  const config = {
    scheduled: { label: "Geplant", className: "bg-status-scheduled-bg text-status-scheduled" },
    live: { label: "LIVE", className: "bg-status-live-bg text-status-live ring-1 ring-status-live/30" },
    finished: { label: "Beendet", className: "bg-status-finished-bg text-status-finished" },
  }
  const c = config[status] || config.scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${c.className}`}>
      {status === "live" && (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-status-live opacity-40 animate-live-pulse" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-status-live" />
        </span>
      )}
      {c.label}
    </span>
  )
}

export function LiveDot({ className = "" }) {
  return (
    <span className={`relative flex h-2.5 w-2.5 shrink-0 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-status-live opacity-40 animate-live-pulse" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-live" />
    </span>
  )
}
