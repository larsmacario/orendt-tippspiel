import { formatKickoff } from "./dates"
import { getTeamFlagEmoji } from "./groups"
import { formatTeamCode, SUMMARY_LEGEND, SCREEN_TOP_LIMIT, formatRankDeltaCaption, formatRankDeltaHint } from "./leaderboard-matrix"

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;")
}

function formatUpdatedAt(iso) {
  if (!iso) return "–"
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  })
}

function renderBadge(badgeUrl, teamName, flagEmoji, size) {
  if (badgeUrl) {
    return `<img src="${escapeAttr(badgeUrl)}" alt="${escapeAttr(teamName)}" width="${size}" height="${size}" class="tv-badge" />`
  }
  if (flagEmoji) {
    return `<span class="tv-flag" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.65)}px" aria-label="${escapeAttr(teamName)}">${flagEmoji}</span>`
  }
  const initials = escapeHtml((teamName || "?").slice(0, 2).toUpperCase())
  return `<span class="tv-badge-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.3)}px">${initials}</span>`
}

function renderTipCell(cell) {
  if (cell.homeTip == null || cell.awayTip == null) {
    return `<span class="tv-kicktipp-tip-miss">–</span>`
  }
  const tip = `${cell.homeTip}:${cell.awayTip}`
  const points = cell.points ?? 0
  if (points > 0) {
    return `<span class="tv-kicktipp-tip-hit">${tip}<sup class="tv-tip-points">${points}</sup></span>`
  }
  return `<span class="tv-kicktipp-tip-miss">${tip}</span>`
}

function renderMatchHeader(match) {
  const homeCode = escapeHtml(formatTeamCode(match.home_team, match.placeholder_home))
  const awayCode = escapeHtml(formatTeamCode(match.away_team, match.placeholder_away))
  const score =
    match.home_score != null && match.away_score != null
      ? `${match.home_score}:${match.away_score}`
      : "–"
  return `<th class="tv-kicktipp-match-col">
    <span class="tv-kicktipp-code">${homeCode}</span>
    <span class="tv-kicktipp-code">${awayCode}</span>
    <span class="tv-kicktipp-score">${escapeHtml(score)}</span>
  </th>`
}

function renderLeaderboardSlide(kicktipp) {
  const matches = kicktipp?.matches || []
  const rows = kicktipp?.rows || []

  if (!matches.length || !rows.length) {
    return `<div class="tv-slide-inner tv-slide-empty">
      <div class="tv-slide-head">
        <h2 class="tv-slide-title">Top Tipper</h2>
        <span class="tv-slide-meta">Noch keine Tipper</span>
      </div>
      <div class="tv-slide-empty-body">
        <p class="tv-empty-title">Noch keine Rangliste</p>
        <p class="tv-empty-sub">Sobald Spiele beendet sind, erscheint hier die Kicktipp-Matrix</p>
      </div>
    </div>`
  }

  const legend = SUMMARY_LEGEND.map(
    (item) => `<span class="tv-kicktipp-legend-item"><strong class="tv-kicktipp-legend-key">${item.key}</strong> ${escapeHtml(item.label)}</span>`
  ).join("")

  const deltaLegend = kicktipp.snapshotMatchday
    ? `<p class="tv-kicktipp-legend-delta">${escapeHtml(formatRankDeltaHint(kicktipp.snapshotMatchday))}</p>`
    : ""

  const matchHeaders = matches.map((m) => renderMatchHeader(m)).join("")

  const bodyRows = rows
    .slice(0, SCREEN_TOP_LIMIT)
    .map((row) => {
      const cells = row.cells.map((cell) => `<td class="tv-kicktipp-tip">${renderTipCell(cell)}</td>`).join("")
      return `<tr class="tv-kicktipp-row">
        <td class="tv-kicktipp-pos">${row.rank}.</td>
        <td class="tv-kicktipp-delta">${escapeHtml(row.rankDeltaLabel || "")}</td>
        <td class="tv-kicktipp-name">${escapeHtml(row.displayName)}</td>
        ${cells}
        <td class="tv-kicktipp-p">${row.windowPoints}</td>
        <td class="tv-kicktipp-sum">${row.championBonus || 0}</td>
        <td class="tv-kicktipp-sum">${escapeHtml(row.windowAverage)}</td>
        <td class="tv-kicktipp-g">${row.totalPoints}</td>
      </tr>`
    })
    .join("")

  const meta = kicktipp.snapshotMatchday
    ? `<span class="tv-slide-meta">${escapeHtml(formatRankDeltaCaption(kicktipp.snapshotMatchday))}</span>`
    : ""

  return `<div class="tv-slide-inner tv-slide-inner-kicktipp">
    <div class="tv-kicktipp-head">
      <h2 class="tv-slide-title">Top Tipper</h2>
      ${meta}
    </div>
    <div class="tv-kicktipp-legend">${legend}${deltaLegend}</div>
    <div class="tv-kicktipp-table-wrap">
      <table class="tv-kicktipp-table">
        <thead>
          <tr>
            <th class="tv-kicktipp-pos">Pos</th>
            <th class="tv-kicktipp-delta">+/-</th>
            <th class="tv-kicktipp-name">Name</th>
            ${matchHeaders}
            <th class="tv-kicktipp-p">P</th>
            <th class="tv-kicktipp-sum">B</th>
            <th class="tv-kicktipp-sum">S</th>
            <th class="tv-kicktipp-g">G</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  </div>`
}

function renderScheduleSlide(upcoming) {
  if (!upcoming?.length) {
    return `<div class="tv-slide-inner tv-slide-empty">
      <p class="tv-empty-title">Keine anstehenden Spiele</p>
    </div>`
  }

  const rows = upcoming
    .map(
      (match) => `<div class="tv-row tv-row-match">
      <span class="tv-kickoff">${escapeHtml(formatKickoff(match.kickoffAt))}</span>
      <div class="tv-match-side tv-match-home">
        <span class="tv-team-name">${escapeHtml(match.homeTeam)}</span>
        ${renderBadge(match.homeBadge, match.homeTeam, null, 48)}
      </div>
      <span class="tv-vs">vs</span>
      <div class="tv-match-side">
        ${renderBadge(match.awayBadge, match.awayTeam, null, 48)}
        <span class="tv-team-name">${escapeHtml(match.awayTeam)}</span>
      </div>
      ${match.groupCode ? `<span class="tv-group">Gr. ${escapeHtml(match.groupCode)}</span>` : ""}
    </div>`
    )
    .join("")

  return `<div class="tv-slide-inner">
    <h2 class="tv-slide-title">Nächste Spiele</h2>
    <div class="tv-slide-body">${rows}</div>
  </div>`
}

function renderTablesSlide(tables) {
  if (!tables?.length) {
    return `<div class="tv-slide-inner tv-slide-empty">
      <p class="tv-empty-title">Keine Tabellen</p>
    </div>`
  }

  const hasResults = tables.some((t) => t.rows.some((r) => r.played > 0))
  const groups = tables
    .map((t) => {
      const rows = t.rows
        .slice(0, 4)
        .map(
          (row, i) => `<tr>
          <td>${row.position ?? i + 1}</td>
          <td><div class="tv-table-team">${renderBadge(row.badge, row.team, row.flagEmoji, 24)}<span>${escapeHtml(row.team)}</span></div></td>
          <td class="tv-num">${row.played}</td>
          <td class="tv-num tv-points-sm">${row.points}</td>
        </tr>`
        )
        .join("")
      return `<div class="tv-group-table">
        <h3>${escapeHtml(t.group)}</h3>
        <table>
          <thead><tr><th>#</th><th>Team</th><th>Sp</th><th>Pkt</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    })
    .join("")

  return `<div class="tv-slide-inner">
    <div class="tv-slide-head">
      <h2 class="tv-slide-title">Gruppentabellen</h2>
      ${!hasResults ? `<span class="tv-slide-meta">Auslosung · noch keine Spiele</span>` : ""}
    </div>
    <div class="tv-tables-grid">${groups}</div>
  </div>`
}

function renderTimelineSlide(timelines) {
  if (!timelines?.length) {
    return `<div class="tv-slide-inner tv-slide-empty">
      <div class="tv-slide-head">
        <h2 class="tv-slide-title">Spiel-Recap</h2>
        <span class="tv-slide-meta">Noch kein Recap</span>
      </div>
      <div class="tv-slide-empty-body">
        <p class="tv-empty-title">Keine Spielereignisse</p>
        <p class="tv-empty-sub">Tore, Karten und Wechsel erscheinen bei laufenden oder beendeten WM-Spielen</p>
      </div>
    </div>`
  }

  const timeline = timelines[0]
  const { event, events, reason } = timeline
  const eventRows = events
    .slice(-10)
    .map(
      (entry) => `<div class="tv-timeline-row">
      <span class="tv-minute">${escapeHtml(entry.minute)}'</span>
      ${entry.teamBadge || entry.teamFlagEmoji || entry.team ? renderBadge(entry.teamBadge, entry.team, entry.teamFlagEmoji, 32) : ""}
      <span class="tv-event-label">${escapeHtml(entry.label)}</span>
      <span class="tv-event-player">${escapeHtml(entry.player)}${entry.player2 ? ` → ${escapeHtml(entry.player2)}` : ""}</span>
    </div>`
    )
    .join("")

  return `<div class="tv-slide-inner">
    <div class="tv-slide-head">
      <h2 class="tv-slide-title">${reason === "live" ? "Spielereignisse" : "Spiel-Recap"}</h2>
      ${reason === "live" ? `<span class="tv-live-badge"><span class="tv-live-dot"></span> Live</span>` : ""}
    </div>
    <div class="tv-match-header">
      <div class="tv-match-side tv-match-home">
        <span class="tv-team-name tv-team-name-lg">${escapeHtml(event.homeTeam)}</span>
        ${renderBadge(event.homeBadge, event.homeTeam, event.homeFlagEmoji, 72)}
      </div>
      <span class="tv-score-lg">${event.homeScore ?? "–"} : ${event.awayScore ?? "–"}</span>
      <div class="tv-match-side">
        ${renderBadge(event.awayBadge, event.awayTeam, event.awayFlagEmoji, 72)}
        <span class="tv-team-name tv-team-name-lg">${escapeHtml(event.awayTeam)}</span>
      </div>
    </div>
    <div class="tv-slide-body tv-timeline-body">${eventRows}</div>
  </div>`
}

function renderResultsSlide(recent) {
  if (!recent?.length) {
    return `<div class="tv-slide-inner tv-slide-empty">
      <div class="tv-slide-head">
        <h2 class="tv-slide-title">Ergebnisse</h2>
        <span class="tv-slide-meta">Noch keine Spiele</span>
      </div>
      <div class="tv-slide-empty-body">
        <p class="tv-empty-title">Noch keine Ergebnisse</p>
        <p class="tv-empty-sub">Beendete WM-Spiele erscheinen hier automatisch</p>
      </div>
    </div>`
  }

  const rows = recent
    .map(
      (match) => `<div class="tv-row tv-row-match">
      <div class="tv-match-side tv-match-home">
        <span class="tv-team-name">${escapeHtml(match.homeTeam)}</span>
        ${renderBadge(match.homeBadge, match.homeTeam, getTeamFlagEmoji(match.homeTeam), 48)}
      </div>
      <span class="tv-score">${match.homeScore ?? "–"} : ${match.awayScore ?? "–"}</span>
      <div class="tv-match-side">
        ${renderBadge(match.awayBadge, match.awayTeam, getTeamFlagEmoji(match.awayTeam), 48)}
        <span class="tv-team-name">${escapeHtml(match.awayTeam)}</span>
      </div>
      ${match.groupCode ? `<span class="tv-group">Gr. ${escapeHtml(match.groupCode)}</span>` : ""}
    </div>`
    )
    .join("")

  return `<div class="tv-slide-inner">
    <h2 class="tv-slide-title">Ergebnisse</h2>
    <div class="tv-slide-body">${rows}</div>
  </div>`
}

function formatEvent(entry) {
  const player = entry.player
    ? ` ${entry.teamFlagEmoji || ""} ${entry.player}`.replace(/\s+/g, " ").trim()
    : ""
  return `${entry.minute}' ${entry.label}${player ? ` ${player}` : ""}`
}

function resolveTickerMode(data) {
  if (data.timelines?.length) return "events"
  if (data.live?.length) return "live-scores"
  if (data.upcoming?.[0]) return "next"
  return "hidden"
}

export function renderTickerHtml(data) {
  const mode = resolveTickerMode(data)
  if (mode === "hidden") return ""

  const isLive = mode === "events" ? data.timelines[0]?.reason === "live" : mode === "live-scores"
  let inner = ""

  if (mode === "events" && data.timelines[0]) {
    const timeline = data.timelines[0]
    const line = timeline.events
      .slice(-6)
      .map(formatEvent)
      .join("   ·   ")
    inner = `${isLive ? `<span class="tv-live-badge tv-live-badge-sm"><span class="tv-live-dot"></span> Live</span>` : ""}
      <span class="tv-ticker-match">${escapeHtml(timeline.event.homeTeam)} ${timeline.event.homeScore ?? "–"}:${timeline.event.awayScore ?? "–"} ${escapeHtml(timeline.event.awayTeam)}</span>
      ${line ? `<span class="tv-ticker-sep">|</span><span class="tv-ticker-line">${escapeHtml(line)}</span>` : ""}`
  } else if (mode === "live-scores") {
    const line = data.live
      .map(
        (m) =>
          `${m.homeTeam} ${m.homeScore ?? "–"}:${m.awayScore ?? "–"} ${m.awayTeam}${m.progress ? ` (${m.progress})` : ""}`
      )
      .join("   ·   ")
    inner = `<span class="tv-live-badge tv-live-badge-sm"><span class="tv-live-dot"></span> Live</span>
      <span class="tv-ticker-line">${escapeHtml(line)}</span>`
  } else if (mode === "next") {
    const match = data.upcoming[0]
    inner = `<span class="tv-ticker-next-label">Nächstes Spiel</span>
      <span class="tv-ticker-match">${escapeHtml(match.homeTeam)} vs ${escapeHtml(match.awayTeam)}</span>
      <span class="tv-ticker-sep">·</span>
      <span class="tv-ticker-time">${escapeHtml(formatKickoff(match.kickoffAt))}</span>`
  }

  return `<div class="tv-ticker ${isLive ? "tv-ticker-live" : ""}"><div class="tv-ticker-inner">${inner}</div></div>`
}

export const SCREEN_TV_SLIDE_IDS = ["leaderboard", "upcoming", "tables", "recap", "recent"]

export function buildScreenTvPayload(data) {
  const slides = [
    { id: "leaderboard", html: renderLeaderboardSlide(data.leaderboard || {}) },
    { id: "upcoming", html: renderScheduleSlide(data.upcoming || []) },
    { id: "tables", html: renderTablesSlide(data.tables || []) },
    { id: "recap", html: renderTimelineSlide(data.timelines || []) },
    { id: "recent", html: renderResultsSlide(data.recent || []) },
  ]

  return {
    updatedAt: data.updatedAt,
    updatedAtFormatted: formatUpdatedAt(data.updatedAt),
    hasLive: (data.live?.length ?? 0) > 0,
    tickerHtml: renderTickerHtml(data),
    slides,
  }
}
