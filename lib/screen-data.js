import { fetchScreenData } from "./sportsdb-display"
import { fetchScreenLeaderboard } from "./screen-leaderboard"

export async function loadScreenData() {
  const [sports, leaderboard] = await Promise.all([
    fetchScreenData(),
    fetchScreenLeaderboard(10),
  ])
  return { ...sports, leaderboard }
}
