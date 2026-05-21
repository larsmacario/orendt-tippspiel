-- pg_cron schedule for sync-matches Edge Function
-- WICHTIG: Service-Role-Key nicht ins Repo committen.
-- Cron-Jobs wurden via Supabase MCP (execute_sql) eingerichtet.
-- Bei Neu-Setup: net.http_post mit Authorization Bearer <SERVICE_ROLE_KEY> verwenden.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Beispiel (Key lokal einsetzen):
-- SELECT cron.schedule('tip_sync_schedule', '0 3 * * *', $$ ... $$);
-- SELECT cron.schedule('tip_sync_live', '*/2 * * * *', $$ ... $$);
