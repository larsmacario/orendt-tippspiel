-- +/- nur für den letzten Spieltag: Snapshots historisch korrekt speichern

CREATE OR REPLACE FUNCTION public.tip_snapshot_completed_matchdays()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_matchday TEXT;
  v_snapshots INTEGER := 0;
BEGIN
  FOR v_matchday IN
    SELECT d.matchday_key
    FROM (
      SELECT public.tip_matchday_key(kickoff_at) AS matchday_key
      FROM public.tip_matches
      GROUP BY public.tip_matchday_key(kickoff_at)
      HAVING COUNT(*) > 0
        AND COUNT(*) = COUNT(*) FILTER (WHERE status = 'finished')
    ) d
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.tip_rank_snapshots s
      WHERE s.matchday_key = d.matchday_key
    )
    ORDER BY d.matchday_key
  LOOP
    INSERT INTO public.tip_rank_snapshots (matchday_key, user_id, rank, total_points)
    SELECT
      v_matchday,
      ranked.user_id,
      ranked.rank,
      ranked.total_points
    FROM (
      SELECT
        p.id AS user_id,
        COALESCE(SUM(pred.points), 0)::INTEGER AS total_points,
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(SUM(pred.points), 0) DESC,
            COALESCE(SUM(CASE WHEN pred.points = 4 THEN 1 ELSE 0 END), 0) DESC,
            COALESCE(SUM(CASE WHEN pred.points = 3 THEN 1 ELSE 0 END), 0) DESC,
            p.display_name
        )::INTEGER AS rank
      FROM public.tip_profiles p
      LEFT JOIN public.tip_predictions pred ON pred.user_id = p.id
      LEFT JOIN public.tip_matches m ON m.id = pred.match_id
        AND m.status = 'finished'
        AND public.tip_matchday_key(m.kickoff_at) <= v_matchday
      WHERE p.is_blocked = false AND p.is_active = true
      GROUP BY p.id, p.display_name
    ) ranked
    ON CONFLICT (matchday_key, user_id) DO UPDATE
      SET rank = EXCLUDED.rank,
          total_points = EXCLUDED.total_points;

    v_snapshots := v_snapshots + 1;
  END LOOP;

  RETURN v_snapshots;
END;
$$;

-- Bestehende Snapshots hatten teils den aktuellen statt historischen Stand
DELETE FROM public.tip_rank_snapshots;

SELECT public.tip_snapshot_completed_matchdays();
