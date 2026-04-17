-- ─── Cron — export Supabase → Google Sheets (minuit chaque nuit) ──────────────
--
-- Prérequis : extension pg_cron activée (Supabase Dashboard → Database → Extensions)
-- Exécuter ce fichier dans l'éditeur SQL de Supabase Dashboard.
--
-- Vérification avant exécution :
--   SELECT * FROM cron.job;
--
-- Suppression si besoin :
--   SELECT cron.unschedule('export-to-sheets-nightly');

-- Active l'extension si pas déjà activée
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Supprime le job si déjà existant (idempotent)
select cron.unschedule('export-to-sheets-nightly')
where exists (select 1 from cron.job where jobname = 'export-to-sheets-nightly');

-- Crée le cron — déclenche l'Edge Function chaque nuit à 00:00 UTC
-- Tous les modules exportés en une seule invocation
select cron.schedule(
  'export-to-sheets-nightly',
  '0 0 * * *',   -- minuit UTC chaque jour
  $$
    select net.http_post(
      url     := (select value from vault.secrets where name = 'supabase_url') || '/functions/v1/export-to-sheets',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select value from vault.secrets where name = 'supabase_anon_key')
      ),
      body    := '{"module":"all"}'::jsonb
    );
  $$
);
