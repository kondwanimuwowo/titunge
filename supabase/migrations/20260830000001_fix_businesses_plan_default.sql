-- 20260827000000_add_platform_admin.sql updated existing rows and added the
-- businesses_plan_check constraint (free|team), but never changed the
-- column's DEFAULT — it was still 'starter' from the original schema. Any
-- new business insert that doesn't explicitly set `plan` (e.g. onboarding's
-- createBusinessAction) hit "violates check constraint businesses_plan_check".

ALTER TABLE public.businesses ALTER COLUMN plan SET DEFAULT 'free';
