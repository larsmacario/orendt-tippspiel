"use client"

import KicktippMatrixTable from "./KicktippMatrixTable"

export default function KicktippLeaderboard({ data, currentUserId }) {
  const matches = data?.matches || []
  const rows = data?.rows || []

  if (!matches.length) {
    return (
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 text-center text-orendt-gray-500">
        Noch keine beendeten Spiele — die Matrix füllt sich nach den ersten Ergebnissen.
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 text-center text-orendt-gray-500">
        Noch keine Ranglistendaten.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
      <KicktippMatrixTable
        rows={rows}
        matches={matches}
        currentUserId={currentUserId}
        snapshotMatchday={data?.snapshotMatchday}
        variant="light"
      />
    </div>
  )
}
