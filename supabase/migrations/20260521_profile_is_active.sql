-- Tippspiel: Aktiv-Status für Teilnahme (nur sichtbar wenn is_active = true)

ALTER TABLE public.tip_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Clean Slate: alle bestehenden Profile starten inaktiv
UPDATE public.tip_profiles SET is_active = false WHERE is_active IS DISTINCT FROM false;

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
