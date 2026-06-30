-- Elfmeter-Ergebnisse für K.o.-Siegerermittlung (TheSportsDB: intHomeScoreExtra / intAwayScoreExtra bei strStatus=PEN)

ALTER TABLE public.tip_matches
  ADD COLUMN IF NOT EXISTS home_pen_score INTEGER,
  ADD COLUMN IF NOT EXISTS away_pen_score INTEGER;

-- Germany vs Paraguay (Spiel 74, external_id 2502846): 1–1, PEN 3–4
UPDATE public.tip_matches
SET
  home_pen_score = 3,
  away_pen_score = 4,
  raw_status = COALESCE(raw_status, 'PEN')
WHERE external_id = '2502846'
  AND status = 'finished';
