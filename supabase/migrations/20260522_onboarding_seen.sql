-- Onboarding: Flag ob Nutzer das Willkommen-Modal bereits gesehen hat

ALTER TABLE public.tip_profiles
  ADD COLUMN IF NOT EXISTS onboarding_seen BOOLEAN NOT NULL DEFAULT false;

-- Bestehende Nutzer gelten als bereits eingeführt (kein Modal bei Rückkehrern)
UPDATE public.tip_profiles SET onboarding_seen = true WHERE onboarding_seen IS DISTINCT FROM true;
