import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const SUPABASE_CONFIG_ERROR =
  "Supabase ist nicht konfiguriert. In Vercel unter Settings → Environment Variables NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen und danach neu deployen."

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR)
  }
}

const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  lockType: "localstorage",
}

let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient) {
    assertSupabaseConfigured()
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions })
  }
  return supabaseClient
}

/** Lazy proxy – kein createClient beim Modul-Import (verhindert Build-Fehler beim Prerender). */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient()
      const value = client[prop]
      return typeof value === "function" ? value.bind(client) : value
    },
  }
)

// ─── AUTH ─────────────────────────────────────────────────────

export async function signUp(email, password, displayName) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, full_name: displayName },
    },
  })
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function requestPasswordReset(email, redirectTo) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}

export async function markPasswordChanged(userId) {
  return supabase
    .from("tip_profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", userId)
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("tip_profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  return profile
}

// ─── PROFILES ─────────────────────────────────────────────────

export async function getProfiles() {
  return supabase.from("tip_profiles").select("*").order("display_name")
}

export async function updateProfile(id, updates) {
  return supabase
    .from("tip_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
}

export async function activateProfile(userId) {
  return updateProfile(userId, { is_active: true })
}

// ─── TEAMS ────────────────────────────────────────────────────

export async function getTeams() {
  return supabase.from("tip_teams").select("*").order("sort_order").order("name")
}

// ─── MATCHES ──────────────────────────────────────────────────

export async function getMatches(phase = null) {
  let query = supabase
    .from("tip_matches")
    .select(`
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji, group_code),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji, group_code)
    `)
    .order("kickoff_at")
    .order("sort_order")

  if (phase) query = query.eq("phase", phase)
  return query
}

export async function getUpcomingMatches(limit = null) {
  let query = supabase
    .from("tip_matches")
    .select(`
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji)
    `)
    .gte("kickoff_at", new Date().toISOString())
    .eq("status", "scheduled")
    .order("kickoff_at")

  if (limit != null) query = query.limit(limit)
  return query
}

export async function getTodayMatches() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  return supabase
    .from("tip_matches")
    .select(`
      *,
      home_team:tip_teams!tip_matches_home_team_id_fkey(id, name, code, badge_url, flag_emoji),
      away_team:tip_teams!tip_matches_away_team_id_fkey(id, name, code, badge_url, flag_emoji)
    `)
    .gte("kickoff_at", start)
    .lte("kickoff_at", end)
    .order("kickoff_at")
}

export async function updateMatch(id, updates) {
  return supabase
    .from("tip_matches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
}

// ─── PREDICTIONS ──────────────────────────────────────────────

export async function getMyPredictions(userId) {
  return supabase
    .from("tip_predictions")
    .select("*, match:tip_matches(*)")
    .eq("user_id", userId)
}

export async function getPredictionsForMatch(matchId) {
  return supabase
    .from("tip_predictions")
    .select("*")
    .eq("match_id", matchId)
}

export async function upsertPrediction({ matchId, userId, homeTip, awayTip }) {
  return supabase
    .from("tip_predictions")
    .upsert(
      {
        match_id: matchId,
        user_id: userId,
        home_tip: homeTip,
        away_tip: awayTip,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" }
    )
    .select()
    .single()
}

export async function deletePrediction({ matchId, userId }) {
  return supabase
    .from("tip_predictions")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", userId)
}

// ─── CHAMPION ─────────────────────────────────────────────────

export async function getChampionPrediction(userId) {
  return supabase
    .from("tip_champion_predictions")
    .select("*, team:tip_teams(*)")
    .eq("user_id", userId)
    .maybeSingle()
}

export async function upsertChampionPrediction(userId, teamId) {
  return supabase
    .from("tip_champion_predictions")
    .upsert(
      { user_id: userId, team_id: teamId, locked_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("*, team:tip_teams(*)")
    .single()
}

// ─── LEADERBOARD ──────────────────────────────────────────────

export async function getLeaderboard() {
  return supabase.from("tip_leaderboard").select("*")
}

export async function getMyRank(userId) {
  const { data } = await getLeaderboard()
  if (!data) return null
  const index = data.findIndex((row) => row.user_id === userId)
  return index >= 0 ? { rank: index + 1, ...data[index] } : null
}

// ─── SETTINGS ─────────────────────────────────────────────────

export async function getSettings() {
  const { data } = await supabase.from("tip_settings").select("*")
  const map = {}
  data?.forEach((row) => { map[row.key] = row.value })
  return map
}

export async function updateSetting(key, value) {
  return supabase
    .from("tip_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single()
}

export async function isTournamentStarted() {
  const settings = await getSettings()
  const start = settings.tournament_start
  if (!start) return false
  return new Date(start) <= new Date()
}

export async function getPredictionLockMinutes() {
  const settings = await getSettings()
  const parsed = parseInt(settings.prediction_lock_minutes || "30", 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30
}

// ─── SYNC LOG ─────────────────────────────────────────────────

export async function getSyncLogs(limit = 20) {
  return supabase
    .from("tip_sync_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)
}

// ─── ADMIN SYNC ───────────────────────────────────────────────

export async function triggerSync(mode = "all", force = true) {
  return supabase.functions.invoke("sync-matches", {
    body: { mode, force, source: "manual" },
  })
}
