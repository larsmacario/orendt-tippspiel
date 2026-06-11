export const metadata = {
  title: "WM 2026 Live | Orendt Studios",
  description: "Live-Anzeige FIFA WM 2026",
  robots: { index: false, follow: false },
}

export default function ScreenLayout({ children }) {
  return (
    <div className="flex h-screen min-h-screen h-dvh w-screen flex-col overflow-hidden bg-orendt-black text-orendt-white cursor-none select-none">
      {children}
    </div>
  )
}
