-- WM 2026 Gruppenzuordnung (Auslosung 05.12.2025)
-- TheSportsDB liefert strGroup oft leer; Zuordnung aus offiziellem Draw.

UPDATE public.tip_teams SET group_code = v.group_code, updated_at = now()
FROM (VALUES
  ('Mexico', 'A'), ('South Africa', 'A'), ('South Korea', 'A'), ('Czech Republic', 'A'),
  ('Canada', 'B'), ('Switzerland', 'B'), ('Qatar', 'B'), ('Bosnia-Herzegovina', 'B'),
  ('Brazil', 'C'), ('Morocco', 'C'), ('Scotland', 'C'), ('Haiti', 'C'),
  ('USA', 'D'), ('Paraguay', 'D'), ('Australia', 'D'), ('Turkey', 'D'),
  ('Germany', 'E'), ('Ecuador', 'E'), ('Ivory Coast', 'E'), ('Curaçao', 'E'),
  ('Netherlands', 'F'), ('Japan', 'F'), ('Tunisia', 'F'), ('Sweden', 'F'),
  ('Belgium', 'G'), ('Iran', 'G'), ('Egypt', 'G'), ('New Zealand', 'G'),
  ('Spain', 'H'), ('Uruguay', 'H'), ('Saudi Arabia', 'H'), ('Cape Verde', 'H'),
  ('France', 'I'), ('Senegal', 'I'), ('Norway', 'I'), ('Iraq', 'I'),
  ('Argentina', 'J'), ('Austria', 'J'), ('Algeria', 'J'), ('Jordan', 'J'),
  ('Portugal', 'K'), ('Colombia', 'K'), ('Uzbekistan', 'K'), ('DR Congo', 'K'),
  ('England', 'L'), ('Croatia', 'L'), ('Panama', 'L'), ('Ghana', 'L')
) AS v(name, group_code)
WHERE tip_teams.name = v.name;

UPDATE public.tip_matches m
SET group_code = ht.group_code, updated_at = now()
FROM public.tip_teams ht
WHERE m.phase = 'group'
  AND m.home_team_id = ht.id
  AND ht.group_code IS NOT NULL
  AND (m.group_code IS NULL OR m.group_code <> ht.group_code);
