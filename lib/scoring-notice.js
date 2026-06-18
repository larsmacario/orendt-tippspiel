export const SCORING_NOTICE_STORAGE_KEY = "orendt-tippspiel-scoring-notice-seen"

export function hasSeenScoringNotice(profile) {
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem(SCORING_NOTICE_STORAGE_KEY) === "1") return true
    } catch {
      // private mode / blocked storage
    }
  }
  return profile?.scoring_notice_seen === true
}

export function markScoringNoticeSeenLocally() {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SCORING_NOTICE_STORAGE_KEY, "1")
  } catch {
    // ignore
  }
}
