-- Marketplace-wide promo codes (not per-seller — a per-seller version is a
-- reasonable future extension, not this pass). Redemption is validated and
-- the discount recomputed entirely server-side in createPendingOrderAction,
-- matching the existing "never trust client-submitted totals" rule there.

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           text NOT NULL UNIQUE,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses       integer,
  use_count      integer NOT NULL DEFAULT 0,
  expires_at     timestamptz,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- No public RLS policy — validated and redeemed only through the
-- service-role client in createPendingOrderAction and the admin CRUD
-- actions, same treatment as platform_settings.
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;
