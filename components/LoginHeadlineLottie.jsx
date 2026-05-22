"use client"

import { useEffect, useState } from "react"
import Lottie from "lottie-react"

const LOTTIE_SRC = "/Soccer Sport Trophy with Soccer Ball and Shoes.json"

export default function LoginHeadlineLottie() {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(encodeURI(LOTTIE_SRC))
      .then((res) => {
        if (!res.ok) throw new Error("Lottie konnte nicht geladen werden")
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data)
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!animationData) return null

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      aria-hidden="true"
      className="w-[min(100%,280px)] sm:w-[320px] mx-auto opacity-[0.22] sm:opacity-25"
    />
  )
}
