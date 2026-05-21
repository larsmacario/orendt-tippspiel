import "./globals.css"

export const metadata = {
  title: "Orendt Studios | WM Tipprunde 2026",
  description: "Internes WM-Tippspiel für Orendt Studios Mitarbeiter",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="font-body bg-orendt-gray-50 text-orendt-black antialiased">
        {children}
      </body>
    </html>
  )
}
