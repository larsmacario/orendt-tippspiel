import { formatKickoff } from "@/lib/dates"
import { ScreenBadge } from "../ScreenBadge"

function MatchRow({ match }) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-orendt-gray-800 last:border-0">
      <div className="shrink-0 whitespace-nowrap text-lg text-orendt-accent font-medium tabular-nums min-w-[11.5rem]">
        {formatKickoff(match.kickoffAt)}
      </div>
      <div className="flex flex-1 items-center gap-3 min-w-0 justify-end">
        <span className="truncate text-right text-xl md:text-2xl font-display font-bold">{match.homeTeam}</span>
        <ScreenBadge badgeUrl={match.homeBadge} teamName={match.homeTeam} size={48} />
      </div>
      <span className="text-orendt-gray-500 font-display text-xl shrink-0">vs</span>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <ScreenBadge badgeUrl={match.awayBadge} teamName={match.awayTeam} size={48} />
        <span className="truncate text-xl md:text-2xl font-display font-bold">{match.awayTeam}</span>
      </div>
      {match.groupCode && (
        <span className="shrink-0 text-sm uppercase tracking-wider text-orendt-gray-500 w-20 text-right">
          Gr. {match.groupCode}
        </span>
      )}
    </div>
  )
}

export default function ScheduleSlide({ upcoming, title = "Nächste Spiele" }) {
  if (!upcoming?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <p className="text-4xl font-display font-bold text-orendt-gray-400">Keine anstehenden Spiele</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-6">
        {title}
      </h2>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        {upcoming.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
