-- ============================================================
-- Orendt WM Tipprunde 2026 – Database Migration
-- Run in Supabase SQL Editor (shared project with ParkShare)
-- ============================================================

-- ─── 1. TIP PROFILES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.tip_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tip_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'tip_role', 'player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tip_on_auth_user_created ON auth.users;
CREATE TRIGGER tip_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tip_handle_new_user();

-- Bestehende auth.users in tip_profiles übernehmen
INSERT INTO public.tip_profiles (id, email, display_name, role)
SELECT id, email,
  COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'player'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ─── 2. TIP TEAMS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  code TEXT,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  badge_url TEXT,
  flag_url TEXT,
  group_code TEXT CHECK (group_code IS NULL OR group_code ~ '^[A-L]$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. TIP MATCHES ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  phase TEXT NOT NULL DEFAULT 'group' CHECK (phase IN ('group', 'r32', 'r16', 'qf', 'sf', 'final3', 'final')),
  group_code TEXT,
  home_team_id UUID REFERENCES public.tip_teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.tip_teams(id) ON DELETE SET NULL,
  placeholder_home TEXT,
  placeholder_away TEXT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  raw_status TEXT,
  venue TEXT,
  last_synced_at TIMESTAMPTZ,
  manual_override BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tip_matches_kickoff ON public.tip_matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_tip_matches_status ON public.tip_matches(status);
CREATE INDEX IF NOT EXISTS idx_tip_matches_phase ON public.tip_matches(phase);

-- ─── 4. TIP PREDICTIONS ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.tip_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.tip_profiles(id) ON DELETE CASCADE,
  home_tip INTEGER NOT NULL CHECK (home_tip >= 0 AND home_tip <= 20),
  away_tip INTEGER NOT NULL CHECK (away_tip >= 0 AND away_tip <= 20),
  points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);

-- ─── 5. TIP CHAMPION PREDICTIONS ────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_champion_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.tip_profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.tip_teams(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. TIP SETTINGS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.tip_settings (key, value) VALUES
  ('points_exact', '4'),
  ('points_diff', '3'),
  ('points_tendency', '2'),
  ('champion_bonus', '25'),
  ('tournament_start', '2026-06-11T19:00:00Z'),
  ('domain_whitelist', ''),
  ('cron_enabled', 'true'),
  ('prediction_lock_minutes', '30')
ON CONFLICT (key) DO NOTHING;

-- ─── 7. TIP SYNC LOG ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tip_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'cron' CHECK (source IN ('cron', 'manual')),
  mode TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'skipped')),
  matches_updated INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.tip_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tip_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.tip_calc_points(
  p_home_tip INTEGER,
  p_away_tip INTEGER,
  p_home_score INTEGER,
  p_away_score INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  tip_diff INTEGER;
  score_diff INTEGER;
BEGIN
  IF p_home_tip IS NULL OR p_away_tip IS NULL OR p_home_score IS NULL OR p_away_score IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_home_tip = p_home_score AND p_away_tip = p_away_score THEN
    RETURN 4;
  END IF;

  tip_diff := p_home_tip - p_away_tip;
  score_diff := p_home_score - p_away_score;

  IF tip_diff = score_diff AND tip_diff <> 0 THEN
    RETURN 3;
  END IF;

  IF (tip_diff > 0 AND score_diff > 0) OR (tip_diff < 0 AND score_diff < 0) OR (tip_diff = 0 AND score_diff = 0) THEN
    RETURN 2;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.tip_recalc_match_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    UPDATE public.tip_predictions
    SET
      points = public.tip_calc_points(home_tip, away_tip, NEW.home_score, NEW.away_score),
      updated_at = now()
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tip_match_points_trigger ON public.tip_matches;
CREATE TRIGGER tip_match_points_trigger
  AFTER UPDATE OF home_score, away_score, status ON public.tip_matches
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.tip_recalc_match_points();

-- Prediction lock: before kickoff minus configured minutes
CREATE OR REPLACE FUNCTION public.tip_prediction_before_kickoff()
RETURNS TRIGGER AS $$
DECLARE
  v_kickoff TIMESTAMPTZ;
  v_lock_minutes INTEGER;
  v_deadline TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.home_tip IS NOT DISTINCT FROM OLD.home_tip
     AND NEW.away_tip IS NOT DISTINCT FROM OLD.away_tip THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  SELECT kickoff_at INTO v_kickoff FROM public.tip_matches WHERE id = NEW.match_id;

  SELECT COALESCE(NULLIF(value, '')::INTEGER, 30) INTO v_lock_minutes
  FROM public.tip_settings
  WHERE key = 'prediction_lock_minutes';

  IF v_lock_minutes IS NULL OR v_lock_minutes < 0 THEN
    v_lock_minutes := 30;
  END IF;

  IF v_kickoff IS NULL THEN
    RAISE EXCEPTION 'Tipp-Sperre: Spiel nicht gefunden';
  END IF;

  v_deadline := v_kickoff - (v_lock_minutes * interval '1 minute');

  IF now() >= v_deadline THEN
    RAISE EXCEPTION 'Tipp-Sperre: Deadline (% Min. vor Anpfiff) überschritten', v_lock_minutes;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tip_prediction_lock ON public.tip_predictions;
CREATE TRIGGER tip_prediction_lock
  BEFORE INSERT OR UPDATE ON public.tip_predictions
  FOR EACH ROW EXECUTE FUNCTION public.tip_prediction_before_kickoff();

-- ─── LEADERBOARD VIEW ───────────────────────────────────────

CREATE OR REPLACE VIEW public.tip_leaderboard AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.email,
  COALESCE(SUM(pred.points), 0)::INTEGER AS match_points,
  COALESCE(SUM(CASE WHEN pred.points = 4 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_hits,
  COALESCE(SUM(CASE WHEN pred.points = 3 THEN 1 ELSE 0 END), 0)::INTEGER AS diff_hits,
  cp.team_id AS champion_team_id,
  t.name AS champion_team_name,
  t.badge_url AS champion_badge_url,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.tip_matches WHERE phase = 'final' AND status = 'finished')
      AND cp.team_id IS NOT NULL
      AND cp.team_id = (
        SELECT CASE WHEN m.home_score > m.away_score THEN m.home_team_id
                    WHEN m.away_score > m.home_score THEN m.away_team_id
                    ELSE NULL END
        FROM public.tip_matches m
        WHERE m.phase = 'final' AND m.status = 'finished'
        LIMIT 1
      )
    THEN (SELECT value::INTEGER FROM public.tip_settings WHERE key = 'champion_bonus')
    ELSE 0
  END AS champion_bonus,
  (
    COALESCE(SUM(pred.points), 0) +
    CASE
      WHEN EXISTS (SELECT 1 FROM public.tip_matches WHERE phase = 'final' AND status = 'finished')
        AND cp.team_id IS NOT NULL
        AND cp.team_id = (
          SELECT CASE WHEN m.home_score > m.away_score THEN m.home_team_id
                      WHEN m.away_score > m.home_score THEN m.away_team_id
                      ELSE NULL END
          FROM public.tip_matches m
          WHERE m.phase = 'final' AND m.status = 'finished'
          LIMIT 1
        )
      THEN (SELECT value::INTEGER FROM public.tip_settings WHERE key = 'champion_bonus')
      ELSE 0
    END
  )::INTEGER AS total_points
FROM public.tip_profiles p
LEFT JOIN public.tip_predictions pred ON pred.user_id = p.id
LEFT JOIN public.tip_champion_predictions cp ON cp.user_id = p.id
LEFT JOIN public.tip_teams t ON t.id = cp.team_id
WHERE p.is_blocked = false AND p.is_active = true
GROUP BY p.id, p.display_name, p.email, cp.team_id, t.name, t.badge_url
ORDER BY total_points DESC, exact_hits DESC, diff_hits DESC, p.display_name;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tip_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_champion_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_sync_log ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "tip_profiles_select" ON public.tip_profiles;
CREATE POLICY "tip_profiles_select" ON public.tip_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_profiles_update_own" ON public.tip_profiles;
CREATE POLICY "tip_profiles_update_own" ON public.tip_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.tip_is_admin());

DROP POLICY IF EXISTS "tip_profiles_admin" ON public.tip_profiles;
CREATE POLICY "tip_profiles_admin" ON public.tip_profiles FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Teams
DROP POLICY IF EXISTS "tip_teams_select" ON public.tip_teams;
CREATE POLICY "tip_teams_select" ON public.tip_teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_teams_admin" ON public.tip_teams;
CREATE POLICY "tip_teams_admin" ON public.tip_teams FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Matches
DROP POLICY IF EXISTS "tip_matches_select" ON public.tip_matches;
CREATE POLICY "tip_matches_select" ON public.tip_matches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_matches_admin" ON public.tip_matches;
CREATE POLICY "tip_matches_admin" ON public.tip_matches FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Predictions
DROP POLICY IF EXISTS "tip_predictions_select" ON public.tip_predictions;
CREATE POLICY "tip_predictions_select" ON public.tip_predictions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_predictions_insert_own" ON public.tip_predictions;
CREATE POLICY "tip_predictions_insert_own" ON public.tip_predictions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tip_predictions_update_own" ON public.tip_predictions;
CREATE POLICY "tip_predictions_update_own" ON public.tip_predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tip_predictions_delete_own" ON public.tip_predictions;
CREATE POLICY "tip_predictions_delete_own" ON public.tip_predictions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tip_predictions_admin" ON public.tip_predictions;
CREATE POLICY "tip_predictions_admin" ON public.tip_predictions FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Champion predictions
DROP POLICY IF EXISTS "tip_champion_select" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_select" ON public.tip_champion_predictions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_champion_insert_own" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_insert_own" ON public.tip_champion_predictions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT EXISTS (SELECT 1 FROM public.tip_settings WHERE key = 'tournament_start')
      OR now() < (SELECT value::timestamptz FROM public.tip_settings WHERE key = 'tournament_start')
    )
  );

DROP POLICY IF EXISTS "tip_champion_update_own" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_update_own" ON public.tip_champion_predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT EXISTS (SELECT 1 FROM public.tip_settings WHERE key = 'tournament_start')
      OR now() < (SELECT value::timestamptz FROM public.tip_settings WHERE key = 'tournament_start')
    )
  );

DROP POLICY IF EXISTS "tip_champion_admin" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_admin" ON public.tip_champion_predictions FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Settings
DROP POLICY IF EXISTS "tip_settings_select" ON public.tip_settings;
CREATE POLICY "tip_settings_select" ON public.tip_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tip_settings_admin" ON public.tip_settings;
CREATE POLICY "tip_settings_admin" ON public.tip_settings FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Sync log
DROP POLICY IF EXISTS "tip_sync_log_select" ON public.tip_sync_log;
CREATE POLICY "tip_sync_log_select" ON public.tip_sync_log FOR SELECT TO authenticated USING (public.tip_is_admin());

DROP POLICY IF EXISTS "tip_sync_log_admin" ON public.tip_sync_log;
CREATE POLICY "tip_sync_log_admin" ON public.tip_sync_log FOR ALL TO authenticated
  USING (public.tip_is_admin());

-- Grant view access
GRANT SELECT ON public.tip_leaderboard TO authenticated;
