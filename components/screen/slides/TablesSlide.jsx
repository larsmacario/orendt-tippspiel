import { ScreenBadge } from "../ScreenBadge"

function GroupTable({ group, rows }) {
  return (
    <div className="min-w-0">
      <h3 className="text-lg font-display font-bold uppercase tracking-wider text-orendt-accent mb-2 truncate">
        {group}
      </h3>
      <table className="w-full text-sm md:text-base">
        <thead>
          <tr className="text-orendt-gray-500 text-left text-xs uppercase tracking-wider">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2">Team</th>
            <th className="pb-2 w-10 text-center">Sp</th>
            <th className="pb-2 w-10 text-center">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 4).map((row, i) => (
            <tr key={i} className="border-t border-orendt-gray-800">
              <td className="py-1.5 font-display font-bold text-orendt-gray-400">{row.position ?? i + 1}</td>
              <td className="py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <ScreenBadge badgeUrl={row.badge} teamName={row.team} flagEmoji={row.flagEmoji} size={24} />
                  <span className="truncate font-medium">{row.team}</span>
                </div>
              </td>
              <td className="py-1.5 text-center tabular-nums text-orendt-gray-400">{row.played}</td>
              <td className="py-1.5 text-center tabular-nums font-display font-bold text-orendt-accent">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TablesSlide({ tables }) {
  if (!tables?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <p className="text-4xl font-display font-bold text-orendt-gray-400">Keine Tabellen</p>
      </div>
    )
  }

  const hasResults = tables.some((t) => t.rows.some((r) => r.played > 0))

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">
          Gruppentabellen
        </h2>
        {!hasResults && (
          <span className="text-sm uppercase tracking-widest text-orendt-gray-500 shrink-0">
            Auslosung · noch keine Spiele
          </span>
        )}
      </div>
      <div className="grid flex-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 content-start overflow-hidden">
        {tables.map((t) => (
          <GroupTable key={t.groupCode || t.group} group={t.group} rows={t.rows} />
        ))}
      </div>
    </div>
  )
}
