-- K.o.-Spiele: TheSportsDB liefert strRound=null, intRound=32 für alle K.o.-Partien.
-- Phasen nach Kickoff-Reihenfolge (erste 8 = r32, nächste 8 = r16).

UPDATE public.tip_matches
SET
  phase = 'r32',
  group_code = NULL,
  updated_at = NOW()
WHERE external_id IN (
  '2499618', -- South Africa vs Canada
  '2499835', -- Brazil vs Japan
  '2502846', -- Germany vs Paraguay
  '2499836', -- Netherlands vs Morocco
  '2502605', -- Ivory Coast vs Norway
  '2502847', -- France vs Sweden
  '2503390', -- Mexico vs Ecuador
  '2503391'  -- England vs DR Congo
)
AND manual_override = false;

UPDATE public.tip_matches
SET
  phase = 'r16',
  group_code = NULL,
  updated_at = NOW()
WHERE external_id IN (
  '2503392', -- Belgium vs Senegal
  '2499837', -- USA vs Bosnia-Herzegovina
  '2503393', -- Portugal vs Croatia
  '2503636', -- Spain vs Austria
  '2502848', -- Australia vs Egypt
  '2502849', -- Argentina vs Cape Verde
  '2503635', -- Switzerland vs Algeria
  '2503394'  -- Colombia vs Ghana
)
AND manual_override = false;
