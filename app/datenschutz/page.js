export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-orendt-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-8">Datenschutz</h1>
        <div className="prose prose-sm text-orendt-gray-700 space-y-4 font-body">
          <p>
            Dieses interne WM-Tippspiel wird von Orendt Studios betrieben. Es werden nur die für die
            Teilnahme notwendigen Daten verarbeitet: E-Mail-Adresse, Anzeigename, Tipps und Punktestand.
          </p>
          <p>
            Die Authentifizierung erfolgt über Supabase Auth. Tipps werden in einer PostgreSQL-Datenbank
            gespeichert. Spielergebnisse werden über TheSportsDB synchronisiert.
          </p>
          <p>
            Bei Fragen wende dich an die IT-Abteilung von Orendt Studios.
          </p>
        </div>
      </div>
    </div>
  )
}
