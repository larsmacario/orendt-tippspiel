import KicktippMatrixTable from "@/components/KicktippMatrixTable"

function LeaderboardEmpty() {
  return (
    <div className="flex h-full flex-col px-8 py-6">
      <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider mb-2">
        Top 15 Tipprunde
      </h2>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
        <p className="text-3xl md:text-4xl font-display font-bold text-orendt-gray-400">
          Noch keine Rangliste
        </p>
        <p className="mt-3 text-lg text-orendt-gray-500">
          Sobald Spiele beendet sind, erscheint hier die Kicktipp-Matrix
        </p>
      </div>
    </div>
  )
}

export default function LeaderboardSlide({ leaderboard }) {
  const matches = leaderboard?.matches || []
  const rows = leaderboard?.rows || []

  if (!matches.length || !rows.length) {
    return <LeaderboardEmpty />
  }

  return (
    <div className="flex h-full flex-col px-8 py-5 min-h-0">
      <div className="flex items-baseline justify-between gap-4 mb-2 shrink-0">
        <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider">
          Top 15 Tipprunde
        </h2>
        {leaderboard.snapshotMatchday && (
          <span className="text-[10px] uppercase tracking-widest text-orendt-gray-500 shrink-0">
            +/- seit {leaderboard.snapshotMatchday}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <KicktippMatrixTable
          rows={rows}
          matches={matches}
          variant="dark"
          size="screen"
          className="h-full"
        />
      </div>
    </div>
  )
}
