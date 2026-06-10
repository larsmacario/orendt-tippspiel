-- Sondertipp: Änderungen nur bis tournament_start erlauben

DROP POLICY IF EXISTS "tip_champion_insert_own" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_insert_own" ON public.tip_champion_predictions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT EXISTS (SELECT 1 FROM public.tip_settings WHERE key = 'tournament_start')
      OR now() < (SELECT value::timestamptz FROM public.tip_settings WHERE key = 'tournament_start')
    )
  );

DROP POLICY IF EXISTS "tip_champion_update_own" ON public.tip_champion_predictions;
CREATE POLICY "tip_champion_update_own" ON public.tip_champion_predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      NOT EXISTS (SELECT 1 FROM public.tip_settings WHERE key = 'tournament_start')
      OR now() < (SELECT value::timestamptz FROM public.tip_settings WHERE key = 'tournament_start')
    )
  );
