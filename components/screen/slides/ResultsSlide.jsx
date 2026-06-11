import { ScreenBadge } from "../ScreenBadge"
import { getTeamFlagEmoji } from "@/lib/groups"

function MatchRow({ match }) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-orendt-gray-800 last:border-0">
      <div className="flex flex-1 items-center gap-3 min-w-0 justify-end">
        <span className="truncate text-right text-xl md:text-2xl font-display font-bold">{match.homeTeam}</span>
        <ScreenBadge badgeUrl={match.homeBadge} teamName={match.homeTeam} flagEmoji={getTeamFlagEmoji(match.homeTeam)} size={48} />
      </div>
      <div className="shrink-0 text-3xl md:text-4xl font-display font-bold tabular-nums text-orendt-accent px-4">
        {match.homeScore ?? "–"} : {match.awayScore ?? "–"}
      </div>
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <ScreenBadge badgeUrl={match.awayBadge} teamName={match.awayTeam} flagEmoji={getTeamFlagEmoji(match.awayTeam)} size={48} />
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

function ResultsEmpty() {
  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          Ergebnisse
        </h2>
        <span className="text-sm uppercase tracking-widest text-orendt-gray-500 shrink-0">
          Noch keine Spiele
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
        <p className="text-4xl md:text-5xl font-display font-bold text-orendt-gray-400">
          Noch keine Ergebnisse
        </p>
        <p className="mt-4 text-xl text-orendt-gray-500">
          Beendete WM-Spiele erscheinen hier automatisch
        </p>
      </div>
    </div>
  )
}

export default function ResultsSlide({ recent }) {
  if (!recent?.length) {
    return <ResultsEmpty />
  }

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-6">
        Ergebnisse
      </h2>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        {recent.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
