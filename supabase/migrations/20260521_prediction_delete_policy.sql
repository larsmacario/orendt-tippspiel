-- Allow users to delete their own predictions (reset tip)
DROP POLICY IF EXISTS "tip_predictions_delete_own" ON public.tip_predictions;
CREATE POLICY "tip_predictions_delete_own" ON public.tip_predictions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
