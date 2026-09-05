-- Real buyer accounts, additive to the existing guest checkout flow. A
-- buyer is just an auth.users row (+ a user_profiles row, same "global
-- identity, no role" shape already used for business users) with zero
-- business_users memberships — no new profile table needed.

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_user_id
  ON public.marketplace_orders(buyer_user_id);

-- First real (non-service-role) read path into marketplace_orders — additive
-- to the existing "no policy, service-role only" default that still covers
-- every other operation (inserts/updates stay server-action-only).
DROP POLICY IF EXISTS buyer_reads_own_orders ON public.marketplace_orders;
CREATE POLICY buyer_reads_own_orders ON public.marketplace_orders
  FOR SELECT USING (buyer_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.marketplace_wishlists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_wishlists_user_id ON public.marketplace_wishlists(user_id);

ALTER TABLE public.marketplace_wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_wishlist ON public.marketplace_wishlists;
CREATE POLICY own_wishlist ON public.marketplace_wishlists
  USING (user_id = auth.uid());
