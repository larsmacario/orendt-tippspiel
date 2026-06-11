"use client"

import { useEffect } from "react"

export default function ScreenTvKioskLoader() {
  useEffect(() => {
    function tryBoot() {
      if (typeof window.__screenTvKioskBoot === "function") {
        window.__screenTvKioskBoot()
        return true
      }
      return false
    }

    if (tryBoot()) return

    var attempts = 0
    var timer = setInterval(function () {
      attempts += 1
      if (tryBoot() || attempts > 40) {
        clearInterval(timer)
      }
    }, 50)

    return function () {
      clearInterval(timer)
    }
  }, [])

  return null
}
