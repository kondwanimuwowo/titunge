-- Fixes a real bug: marketplace_orders.status is one column for the whole
-- order, but an order can span multiple sellers (marketplace_order_items
-- already carries its own business_id). Before this migration, ANY seller
-- with a single line item on a shared order could flip the whole order to
-- 'delivered' via advanceMarketplaceOrderStatusAction, and the delivery
-- trigger would then start every seller's 24h payout clock — including
-- sellers who hadn't shipped anything.
--
-- Fix: give fulfillment its own per-seller table, matching the granularity
-- marketplace_order_payouts already uses correctly. marketplace_orders.status
-- becomes a derived aggregate (kept for the buyer-facing display / /my-orders,
-- which nothing here needs to change) instead of the thing sellers write to.

CREATE TABLE IF NOT EXISTS public.marketplace_order_fulfillments (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'being_sewn'
                  CHECK (status IN ('being_sewn', 'shipped', 'delivered')),
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (order_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_order_fulfillments_business_id
  ON public.marketplace_order_fulfillments(business_id);

ALTER TABLE public.marketplace_order_fulfillments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.marketplace_order_fulfillments;
CREATE POLICY tenant_isolation ON public.marketplace_order_fulfillments
  USING (business_id IN (SELECT public.my_business_ids()));

-- Re-point the payout-eligibility trigger at per-seller fulfillment instead
-- of order-wide status. Fires once per seller, correctly, since it's now
-- driven by a row that only ever represents one seller.
CREATE OR REPLACE FUNCTION public.handle_marketplace_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_hours integer;
  order_subtotal numeric;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;

    SELECT payout_release_window_hours INTO window_hours FROM public.platform_settings WHERE id = true;
    window_hours := COALESCE(window_hours, 24);

    SELECT COALESCE(SUM(unit_price * qty), 0) INTO order_subtotal
    FROM public.marketplace_order_items
    WHERE order_id = NEW.order_id AND business_id = NEW.business_id;

    INSERT INTO public.marketplace_order_payouts (order_id, business_id, subtotal, payout_status, payout_eligible_at)
    VALUES (NEW.order_id, NEW.business_id, order_subtotal, 'pending', NEW.delivered_at + (window_hours || ' hours')::interval)
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

CREATE TRIGGER trg_marketplace_order_fulfillment_delivered
  BEFORE UPDATE ON public.marketplace_order_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_marketplace_order_delivered();

-- Keeps marketplace_orders.status as a derived aggregate so buyer-facing
-- screens (/my-orders, order confirmation) keep working unchanged: delivered
-- only when every seller's fulfillment is delivered, shipped once every
-- seller has at least shipped, being_sewn otherwise. Never touches orders
-- that are awaiting_payment or cancelled — those aren't driven by fulfillment.
CREATE OR REPLACE FUNCTION public.sync_marketplace_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sellers integer;
  delivered_sellers integer;
  shipped_or_further integer;
  current_order_status text;
BEGIN
  SELECT status INTO current_order_status FROM public.marketplace_orders WHERE id = NEW.order_id;
  IF current_order_status IS NULL OR current_order_status IN ('awaiting_payment', 'cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE status = 'delivered'),
         count(*) FILTER (WHERE status IN ('shipped', 'delivered'))
  INTO total_sellers, delivered_sellers, shipped_or_further
  FROM public.marketplace_order_fulfillments
  WHERE order_id = NEW.order_id;

  UPDATE public.marketplace_orders
  SET status = CASE
                  WHEN total_sellers > 0 AND delivered_sellers = total_sellers THEN 'delivered'
                  WHEN total_sellers > 0 AND shipped_or_further = total_sellers THEN 'shipped'
                  ELSE 'being_sewn'
                END,
      delivered_at = CASE WHEN total_sellers > 0 AND delivered_sellers = total_sellers THEN now() ELSE delivered_at END,
      updated_at = now()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_marketplace_order_status ON public.marketplace_order_fulfillments;

CREATE TRIGGER trg_sync_marketplace_order_status
  AFTER INSERT OR UPDATE ON public.marketplace_order_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_marketplace_order_status();
