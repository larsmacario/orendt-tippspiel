import { ScreenBadge } from "../ScreenBadge"

function MatchRow({ match, large = false }) {
  const scoreSize = large ? "text-6xl md:text-7xl" : "text-4xl md:text-5xl"
  const nameSize = large ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
  const badgeSize = large ? 96 : 72

  return (
    <div className={`flex items-center justify-between gap-6 ${large ? "py-6" : "py-4"}`}>
      <div className={`flex flex-1 items-center gap-4 justify-end min-w-0 ${nameSize} font-display font-bold`}>
        <span className="truncate text-right">{match.homeTeam}</span>
        <ScreenBadge badgeUrl={match.homeBadge} teamName={match.homeTeam} size={badgeSize} />
      </div>
      <div className="flex flex-col items-center shrink-0 px-4">
        <div className={`${scoreSize} font-display font-bold tabular-nums text-orendt-accent`}>
          {match.homeScore ?? "–"} : {match.awayScore ?? "–"}
        </div>
        {match.progress && (
          <span className="mt-1 text-sm uppercase tracking-widest text-status-live animate-live-pulse">
            {match.progress}
          </span>
        )}
      </div>
      <div className={`flex flex-1 items-center gap-4 min-w-0 ${nameSize} font-display font-bold`}>
        <ScreenBadge badgeUrl={match.awayBadge} teamName={match.awayTeam} size={badgeSize} />
        <span className="truncate">{match.awayTeam}</span>
      </div>
    </div>
  )
}

export default function LiveSlide({ live }) {
  if (!live?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <p className="text-4xl md:text-5xl font-display font-bold text-orendt-gray-400">
          Keine Live-Spiele
        </p>
        <p className="mt-4 text-xl text-orendt-gray-500">Aktuell läuft kein WM-Spiel</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-status-live opacity-40 animate-live-pulse" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-status-live" />
        </span>
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          Live
        </h2>
      </div>
      <div className="flex flex-1 flex-col justify-center divide-y divide-orendt-gray-800">
        {live.map((match) => (
          <MatchRow key={match.id} match={match} large={live.length === 1} />
        ))}
      </div>
    </div>
  )
}
