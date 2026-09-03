-- Marketplace seller payouts. Orders can span multiple sellers (each
-- marketplace_order_items row already carries its own business_id), so
-- payouts are tracked per seller per order, not per order.

ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE TABLE IF NOT EXISTS public.business_payout_profiles (
  business_id       uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  payout_method     text CHECK (payout_method IN ('bank-account', 'mobile-money')),
  account_details   jsonb NOT NULL DEFAULT '{}'::jsonb,
  lenco_recipient_id text,
  verified_at       timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.business_payout_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.business_payout_profiles;
CREATE POLICY tenant_isolation ON public.business_payout_profiles
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE TABLE IF NOT EXISTS public.marketplace_order_payouts (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  business_id        uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subtotal           numeric NOT NULL,
  platform_fee       numeric,
  lenco_transfer_fee numeric,
  payout_amount      numeric,
  payout_status      text NOT NULL DEFAULT 'not_eligible'
                       CHECK (payout_status IN ('not_eligible', 'pending', 'processing', 'completed', 'failed')),
  payout_reference   text,
  payout_lenco_id    text,
  payout_eligible_at timestamptz,
  payout_retries     integer NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (order_id, business_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_order_payouts_reference
  ON public.marketplace_order_payouts(payout_reference) WHERE payout_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_order_payouts_status
  ON public.marketplace_order_payouts(payout_status, payout_eligible_at);

ALTER TABLE public.marketplace_order_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.marketplace_order_payouts;
CREATE POLICY tenant_isolation ON public.marketplace_order_payouts
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE TABLE IF NOT EXISTS public.payout_log (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_payout_id  uuid NOT NULL REFERENCES public.marketplace_order_payouts(id) ON DELETE CASCADE,
  amount           numeric,
  platform_fee     numeric,
  lenco_transfer_fee numeric,
  status           text NOT NULL,
  lenco_transfer_id text,
  failure_reason   text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.payout_log ENABLE ROW LEVEL SECURITY;

-- A business can read the audit log for its own payouts (join through
-- marketplace_order_payouts); writes are always via the service-role client.
DROP POLICY IF EXISTS tenant_isolation ON public.payout_log;
CREATE POLICY tenant_isolation ON public.payout_log
  FOR SELECT USING (
    order_payout_id IN (
      SELECT id FROM public.marketplace_order_payouts
      WHERE business_id IN (SELECT public.my_business_ids())
    )
  );

-- When an order transitions to 'delivered', create/refresh one payout row
-- per seller on that order (grouped by marketplace_order_items.business_id),
-- eligible payout_release_window_hours after delivery. A trigger (rather
-- than relying on every future "mark delivered" code path to remember this)
-- so it can never be silently skipped.
CREATE OR REPLACE FUNCTION public.handle_marketplace_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_hours integer;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;

    SELECT payout_release_window_hours INTO window_hours FROM public.platform_settings WHERE id = true;
    window_hours := COALESCE(window_hours, 24);

    INSERT INTO public.marketplace_order_payouts (order_id, business_id, subtotal, payout_status, payout_eligible_at)
    SELECT
      NEW.id,
      items.business_id,
      SUM(items.unit_price * items.qty),
      'pending',
      NEW.delivered_at + (window_hours || ' hours')::interval
    FROM public.marketplace_order_items items
    WHERE items.order_id = NEW.id AND items.business_id IS NOT NULL
    GROUP BY items.business_id
    ON CONFLICT (order_id, business_id) DO UPDATE
      SET payout_eligible_at = EXCLUDED.payout_eligible_at,
          payout_status = CASE WHEN public.marketplace_order_payouts.payout_status = 'not_eligible'
                                THEN 'pending' ELSE public.marketplace_order_payouts.payout_status END,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_marketplace_order_delivered ON public.marketplace_orders;
CREATE TRIGGER trg_marketplace_order_delivered
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_marketplace_order_delivered();
