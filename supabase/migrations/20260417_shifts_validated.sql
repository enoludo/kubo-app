-- ─── Shifts — colonne validated ───────────────────────────────────────────────
--
-- Vérifie si la colonne existe :
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_name = 'shifts' AND column_name = 'validated';
--
-- Exécuter dans Supabase Dashboard → SQL Editor si la colonne est absente.

alter table shifts
  add column if not exists validated boolean not null default false;
