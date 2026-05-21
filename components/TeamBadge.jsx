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
    live: { label: "Live", className: "bg-status-live-bg text-status-live" },
    finished: { label: "Beendet", className: "bg-status-finished-bg text-status-finished" },
  }
  const c = config[status] || config.scheduled
  return (
    <span className={`text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${c.className}`}>
      {c.label}
    </span>
  )
}
