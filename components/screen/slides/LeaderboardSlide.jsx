import { ScreenBadge } from "../ScreenBadge"

function LeaderboardRow({ row }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-orendt-gray-800 last:border-0">
      <span className="w-10 shrink-0 font-display font-bold text-xl text-orendt-gray-400 tabular-nums">
        {row.rank}
      </span>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {row.championBadgeUrl && (
          <ScreenBadge
            badgeUrl={row.championBadgeUrl}
            teamName={row.championTeamName}
            size={28}
          />
        )}
        <span className="truncate text-xl md:text-2xl font-display font-bold">{row.displayName}</span>
      </div>
      <span className="shrink-0 w-16 text-center text-sm text-orendt-gray-500 tabular-nums hidden sm:block">
        {row.exactHits} exakt
      </span>
      <span className="shrink-0 w-20 text-right font-display font-bold text-2xl text-orendt-accent tabular-nums">
        {row.totalPoints}
      </span>
    </div>
  )
}

function LeaderboardEmpty() {
  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          Top 10 Tipprunde
        </h2>
        <span className="text-sm uppercase tracking-widest text-orendt-gray-500 shrink-0">
          Noch keine Tipper
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
        <p className="text-4xl md:text-5xl font-display font-bold text-orendt-gray-400">
          Noch keine Rangliste
        </p>
        <p className="mt-4 text-xl text-orendt-gray-500">
          Sobald Tipper aktiv sind, erscheint hier die Top 10
        </p>
      </div>
    </div>
  )
}

export default function LeaderboardSlide({ leaderboard }) {
  if (!leaderboard?.length) {
    return <LeaderboardEmpty />
  }

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-6">
        Top 10 Tipprunde
      </h2>
      <div className="flex items-center gap-4 px-0 pb-2 text-xs uppercase tracking-wider text-orendt-gray-500 border-b border-orendt-gray-800">
        <span className="w-10">#</span>
        <span className="flex-1">Spieler</span>
        <span className="w-16 text-center hidden sm:block">Exakt</span>
        <span className="w-20 text-right">Pkt</span>
      </div>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        {leaderboard.map((row) => (
          <LeaderboardRow key={row.rank} row={row} />
        ))}
      </div>
    </div>
  )
}
