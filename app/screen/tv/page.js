import ScreenTvKioskLoader from "@/components/screen/ScreenTvKioskLoader"
import { loadScreenData } from "@/lib/screen-data"
import { buildScreenTvPayload, SCREEN_TV_SLIDE_IDS } from "@/lib/screen-tv-html"
import "./screen-tv.css"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "WM 2026 Live | Orendt Studios (TV)",
  description: "WM-Live-Anzeige für LG webOS und Kiosk-Browser",
  robots: { index: false, follow: false },
}

export default async function ScreenTvPage() {
  let payload

  try {
    const data = await loadScreenData()
    payload = buildScreenTvPayload(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler"
    return (
      <div className="screen-tv-app screen-tv-error">
        <p className="screen-tv-error-title">Verbindungsfehler</p>
        <p className="screen-tv-error-msg">{message}</p>
      </div>
    )
  }

  return (
    <>
      <div
        className="screen-tv-app"
        data-has-live={payload.hasLive ? "1" : "0"}
        data-slide-count={SCREEN_TV_SLIDE_IDS.length}
        style={{ "--tv-progress": "0%" }}
        suppressHydrationWarning
      >
        <header className="screen-tv-header">
          <div className="screen-tv-brand">
            <span className="screen-tv-title">FIFA WM 2026</span>
            <span className="screen-tv-sep">|</span>
            <span className="screen-tv-subtitle">Orendt Studios</span>
          </div>
          <div className="screen-tv-updated" id="screen-tv-updated" suppressHydrationWarning>
            Aktualisiert {payload.updatedAtFormatted}
          </div>
        </header>

        <div
          id="screen-tv-ticker"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: payload.tickerHtml }}
        />

        <main className="screen-tv-main" id="screen-tv-main" suppressHydrationWarning>
          {payload.slides.map((slide, index) => (
            <section
              key={slide.id}
              className={`screen-tv-slide${index === 0 ? " is-active" : ""}`}
              data-slide={slide.id}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: slide.html }}
            />
          ))}
        </main>

        <footer className="screen-tv-footer" suppressHydrationWarning>
          <div className="screen-tv-dots" id="screen-tv-dots">
            {payload.slides.map((slide, index) => (
              <span
                key={slide.id}
                className={`screen-tv-dot${index === 0 ? " is-active" : ""}`}
                data-dot={slide.id}
              />
            ))}
          </div>
          <div className="screen-tv-progress-track" aria-hidden="true" />
        </footer>
      </div>

      <ScreenTvKioskLoader />
    </>
  )
}
