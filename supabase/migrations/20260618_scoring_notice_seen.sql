-- Hinweis-Dialog zur Punkte-Anpassung (Dashboard)

ALTER TABLE public.tip_profiles
  ADD COLUMN IF NOT EXISTS scoring_notice_seen BOOLEAN NOT NULL DEFAULT false;
