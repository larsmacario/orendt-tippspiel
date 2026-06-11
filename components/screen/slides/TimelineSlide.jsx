import { ScreenBadge } from "../ScreenBadge"

function MatchHeader({ event }) {
  return (
    <div className="flex items-center justify-center gap-6 mb-6 pb-6 border-b border-orendt-gray-800">
      <div className="flex flex-1 items-center gap-4 justify-end min-w-0">
        <span className="truncate text-right text-2xl md:text-3xl font-display font-bold">{event.homeTeam}</span>
        <ScreenBadge
          badgeUrl={event.homeBadge}
          teamName={event.homeTeam}
          flagEmoji={event.homeFlagEmoji}
          size={72}
        />
      </div>
      <div className="shrink-0 text-4xl md:text-5xl font-display font-bold text-orendt-accent tabular-nums px-4">
        {event.homeScore ?? "–"} : {event.awayScore ?? "–"}
      </div>
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <ScreenBadge
          badgeUrl={event.awayBadge}
          teamName={event.awayTeam}
          flagEmoji={event.awayFlagEmoji}
          size={72}
        />
        <span className="truncate text-2xl md:text-3xl font-display font-bold">{event.awayTeam}</span>
      </div>
    </div>
  )
}

function TimelineList({ timeline }) {
  const { event, events, reason } = timeline

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          {reason === "live" ? "Spielereignisse" : "Spiel-Recap"}
        </h2>
        {reason === "live" && (
          <span className="flex items-center gap-2 text-status-live text-sm uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-status-live animate-live-pulse" />
            Live
          </span>
        )}
      </div>

      <MatchHeader event={event} />

      <div className="flex flex-1 flex-col justify-center gap-3 overflow-hidden">
        {events.slice(-10).map((entry, i) => (
          <div key={i} className="flex items-center gap-4 text-lg md:text-xl">
            <span className="w-12 shrink-0 text-right font-display font-bold text-orendt-accent tabular-nums">
              {entry.minute}&apos;
            </span>
            {(entry.teamBadge || entry.teamFlagEmoji || entry.team) && (
              <ScreenBadge
                badgeUrl={entry.teamBadge}
                teamName={entry.team}
                flagEmoji={entry.teamFlagEmoji}
                size={32}
              />
            )}
            <span className="shrink-0 px-3 py-1 rounded-lg bg-orendt-gray-900 text-sm uppercase tracking-wide text-orendt-gray-300">
              {entry.label}
            </span>
            <span className="truncate font-medium">
              {entry.player}
              {entry.player2 ? ` → ${entry.player2}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecapEmpty() {
  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          Spiel-Recap
        </h2>
        <span className="text-sm uppercase tracking-widest text-orendt-gray-500 shrink-0">
          Noch kein Recap
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
        <p className="text-4xl md:text-5xl font-display font-bold text-orendt-gray-400">
          Keine Spielereignisse
        </p>
        <p className="mt-4 text-xl text-orendt-gray-500">
          Tore, Karten und Wechsel erscheinen bei laufenden oder beendeten WM-Spielen
        </p>
      </div>
    </div>
  )
}

export default function TimelineSlide({ timelines }) {
  if (!timelines?.length) {
    return <RecapEmpty />
  }

  return <TimelineList timeline={timelines[0]} />
}
