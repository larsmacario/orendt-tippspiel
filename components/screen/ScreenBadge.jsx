import Image from "next/image"

export function ScreenBadge({ badgeUrl, teamName, flagEmoji, size = 64 }) {
  if (badgeUrl) {
    return (
      <Image
        src={badgeUrl}
        alt={teamName || ""}
        width={size}
        height={size}
        className="object-contain drop-shadow-lg"
        unoptimized
      />
    )
  }
  if (flagEmoji) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.65 }}
        aria-label={teamName || ""}
      >
        {flagEmoji}
      </div>
    )
  }
  return (
    <div
      className="rounded-full bg-orendt-gray-800 flex items-center justify-center font-display font-bold text-orendt-accent"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {(teamName || "?").slice(0, 2).toUpperCase()}
    </div>
  )
}
