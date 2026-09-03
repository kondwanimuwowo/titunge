-- schema.sql never had deleted_at on materials/production_batches, yet
-- deleteMaterialAction/restoreMaterialAction (src/app/actions/inventory.ts)
-- and their production.ts equivalents write to it. A fresh install from
-- schema.sql alone would break both delete/restore actions on day one —
-- this brings any already-provisioned database in line with the same fix.

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.production_batches ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
