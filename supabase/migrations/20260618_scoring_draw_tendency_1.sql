-- Remis-Tendenz: 1 Punkt (Siege weiterhin 2)

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

  IF (tip_diff > 0 AND score_diff > 0) OR (tip_diff < 0 AND score_diff < 0) THEN
    RETURN 2;
  END IF;

  IF tip_diff = 0 AND score_diff = 0 THEN
    RETURN 1;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE public.tip_predictions p
SET
  points = public.tip_calc_points(p.home_tip, p.away_tip, m.home_score, m.away_score),
  updated_at = now()
FROM public.tip_matches m
WHERE p.match_id = m.id
  AND m.status = 'finished'
  AND m.home_score IS NOT NULL
  AND m.away_score IS NOT NULL;
