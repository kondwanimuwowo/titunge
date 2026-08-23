-- Continues the schema-drift cleanup from the assigned_tailor_id fix. The order
-- creation/edit UI (CreateOrderForm, OrderEditForm, StatusTimeline, OrderStatusBadge,
-- OrderContextPanel) was carried over from gloriaz-daughter unchanged and expects:
--  - orders.product_id / orders.description / orders.cancellation_reason / orders.cancelled_at
--  - the original 8-state status enum (enquiry/contacted/measurements/production/
--    fitting/completed/delivered/cancelled), not titunge's simplified 7-state one
--  - materials.last_restocked (restock action writes it, nothing reads it yet)
-- (order_items itself was already restored by 20260811000000_add_order_items.sql.)
-- None of this was applied when the multi-tenant schema was written.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS product_id          uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz;

-- Replace the status CHECK with the union of both enums so existing rows (whatever
-- they currently hold) never violate it, while the new default matches what
-- CreateOrderForm actually inserts.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending','in_progress','production','ready','completed','delivered','cancelled',
    'enquiry','contacted','measurements','fitting'
  ));
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'enquiry';

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS last_restocked timestamptz;

-- user_profiles' own_profile policy (id = auth.uid()) only ever let a user read
-- their own row. The Users list does a second query for every business member's
-- profile to show their name — RLS silently filtered those out, so any user
-- other than the one running the query showed up with a blank name (em dash).
DROP POLICY IF EXISTS "business_mates_read_profiles" ON public.user_profiles;
CREATE POLICY "business_mates_read_profiles" ON public.user_profiles
  FOR SELECT USING (
    id IN (SELECT user_id FROM public.business_users WHERE business_id IN (SELECT public.my_business_ids()))
  );
