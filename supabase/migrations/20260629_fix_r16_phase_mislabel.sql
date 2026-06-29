-- DieSportsDB liefert alle 16 Letzte-32-Spiele (73–88) als intRound=32.
-- Fälschlich als r16 markierte Spiele zurück auf r32 setzen.

UPDATE public.tip_matches
SET
  phase = 'r32',
  group_code = NULL,
  updated_at = NOW()
WHERE external_id IN (
  '2503392', -- Match 82: Belgium vs Senegal
  '2499837', -- Match 81: USA vs Bosnia
  '2503393', -- Match 83: Portugal vs Croatia
  '2503636', -- Match 84: Spain vs Austria
  '2502848', -- Match 88: Australia vs Egypt
  '2502849', -- Match 86: Argentina vs Cape Verde
  '2503635', -- Match 85: Switzerland vs Algeria
  '2503394'  -- Match 87: Colombia vs Ghana
)
AND manual_override = false;
