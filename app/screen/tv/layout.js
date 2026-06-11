import Script from "next/script"

const KIOSK_SRC = "/screen-kiosk.js?v=6"

export default function ScreenTvLayout({ children }) {
  return (
    <>
      <div className="screen-tv-shell flex h-full min-h-screen w-full flex-1 flex-col overflow-hidden bg-[#0A0A0A] text-white">
        {children}
      </div>
      <Script id="screen-tv-kiosk" src={KIOSK_SRC} strategy="afterInteractive" />
    </>
  )
}
