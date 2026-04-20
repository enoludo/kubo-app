-- ─── Cron — sync photos Drive → Supabase (toutes les heures) ─────────────────
--
-- Prérequis : pg_cron et pg_net activés (déjà fait via export_cron)
-- Exécuter dans l'éditeur SQL Supabase Dashboard.
--
-- Suppression si besoin :
--   SELECT cron.unschedule('sync-drive-photos-hourly');

select cron.unschedule('sync-drive-photos-hourly')
where exists (select 1 from cron.job where jobname = 'sync-drive-photos-hourly');

select cron.schedule(
  'sync-drive-photos-hourly',
  '0 * * * *',   -- toutes les heures
  $$
    select net.http_post(
      url     := (select value from vault.secrets where name = 'supabase_url') || '/functions/v1/sync-drive-photos',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select value from vault.secrets where name = 'supabase_anon_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
