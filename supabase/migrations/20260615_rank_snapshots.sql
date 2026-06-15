-- Rank snapshots per Berlin matchday for Kicktipp-style +/- column

CREATE TABLE IF NOT EXISTS public.tip_rank_snapshots (
  matchday_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.tip_profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (matchday_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tip_rank_snapshots_matchday
  ON public.tip_rank_snapshots(matchday_key);

CREATE OR REPLACE FUNCTION public.tip_matchday_key(kickoff TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(kickoff AT TIME ZONE 'Europe/Berlin', 'YYYY-MM-DD');
$$;

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
        lb.user_id,
        lb.total_points,
        ROW_NUMBER() OVER (
          ORDER BY lb.total_points DESC, lb.exact_hits DESC, lb.diff_hits DESC, lb.display_name
        )::INTEGER AS rank
      FROM public.tip_leaderboard lb
    ) ranked
    ON CONFLICT (matchday_key, user_id) DO UPDATE
      SET rank = EXCLUDED.rank,
          total_points = EXCLUDED.total_points;

    v_snapshots := v_snapshots + 1;
  END LOOP;

  RETURN v_snapshots;
END;
$$;

ALTER TABLE public.tip_rank_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tip_rank_snapshots_select" ON public.tip_rank_snapshots;
CREATE POLICY "tip_rank_snapshots_select" ON public.tip_rank_snapshots
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.tip_rank_snapshots TO authenticated;
GRANT EXECUTE ON FUNCTION public.tip_snapshot_completed_matchdays() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tip_snapshot_completed_matchdays() TO service_role;
