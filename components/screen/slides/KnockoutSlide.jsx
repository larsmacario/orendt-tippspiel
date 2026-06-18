import KnockoutBracket from "@/components/knockout/KnockoutBracket"

export default function KnockoutSlide({ knockout, title = "K.o.-Phase" }) {
  if (!knockout?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <p className="text-4xl font-display font-bold text-orendt-gray-400">Noch keine K.o.-Spiele</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-8 py-6 min-h-0">
      <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider mb-4 shrink-0">
        {title}
      </h2>
      <div className="flex-1 min-h-0 overflow-hidden">
        <KnockoutBracket
          matches={knockout}
          variant="dark"
          size="screen"
          editable={false}
          className="h-full"
        />
      </div>
    </div>
  )
}
