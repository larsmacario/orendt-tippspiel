import { fetchScreenData } from "./sportsdb-display"
import { fetchScreenLeaderboard } from "./screen-leaderboard"

export async function loadScreenData() {
  const [sports, leaderboard] = await Promise.all([
    fetchScreenData(),
    fetchScreenLeaderboard(),
  ])
  return { ...sports, leaderboard }
}
