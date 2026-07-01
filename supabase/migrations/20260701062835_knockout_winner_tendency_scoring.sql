-- K.o.-Wertung: Das 90-Minuten-Ergebnis bestimmt 4/3 Punkte.
-- Endet es remis, bestimmt der Sieger im Elfmeterschießen die 2-Punkte-Tendenz.

CREATE OR REPLACE FUNCTION public.tip_calc_match_points(
  p_home_tip INTEGER,
  p_away_tip INTEGER,
  p_home_score INTEGER,
  p_away_score INTEGER,
  p_home_pen_score INTEGER,
  p_away_pen_score INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  tip_diff INTEGER;
  score_diff INTEGER;
  winner_diff INTEGER;
BEGIN
  IF p_home_tip IS NULL OR p_away_tip IS NULL OR p_home_score IS NULL OR p_away_score IS NULL THEN
    RETURN NULL;
  END IF;

  -- Exaktes Ergebnis bezieht sich weiterhin auf 90 Minuten.
  IF p_home_tip = p_home_score AND p_away_tip = p_away_score THEN
    RETURN 4;
  END IF;

  tip_diff := p_home_tip - p_away_tip;
  score_diff := p_home_score - p_away_score;

  -- Tordifferenz-Punkte gibt es nur bei einem Sieg nach 90 Minuten.
  IF score_diff <> 0 AND tip_diff = score_diff THEN
    RETURN 3;
  END IF;

  winner_diff := score_diff;
  IF score_diff = 0
     AND p_home_pen_score IS NOT NULL
     AND p_away_pen_score IS NOT NULL
     AND p_home_pen_score <> p_away_pen_score THEN
    winner_diff := p_home_pen_score - p_away_pen_score;
  END IF;

  IF (tip_diff > 0 AND winner_diff > 0)
     OR (tip_diff < 0 AND winner_diff < 0)
     OR (tip_diff = 0 AND winner_diff = 0) THEN
    RETURN 2;
  END IF;

  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.tip_recalc_match_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    UPDATE public.tip_predictions
    SET
      points = public.tip_calc_match_points(
        home_tip,
        away_tip,
        NEW.home_score,
        NEW.away_score,
        NEW.home_pen_score,
        NEW.away_pen_score
      ),
      updated_at = now()
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tip_recalc_match_points() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tip_match_points_trigger ON public.tip_matches;
CREATE TRIGGER tip_match_points_trigger
  AFTER UPDATE OF home_score, away_score, home_pen_score, away_pen_score, status
  ON public.tip_matches
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.tip_recalc_match_points();

UPDATE public.tip_predictions p
SET
  points = public.tip_calc_match_points(
    p.home_tip,
    p.away_tip,
    m.home_score,
    m.away_score,
    m.home_pen_score,
    m.away_pen_score
  ),
  updated_at = now()
FROM public.tip_matches m
WHERE p.match_id = m.id
  AND m.status = 'finished'
  AND m.home_score IS NOT NULL
  AND m.away_score IS NOT NULL;

SELECT public.tip_snapshot_completed_matchdays();
