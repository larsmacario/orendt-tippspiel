-- Punkte-Nachberechnung darf Tipp-Sperre nicht blockieren.
-- Der Lock gilt nur für Änderungen an home_tip / away_tip.

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
