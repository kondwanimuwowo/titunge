-- Lets a business choose who pays the 10% Titunge marketplace commission:
-- absorbed (today's only behavior — deducted from the seller's payout) or
-- passed to the customer as a separate checkout line, so the seller
-- receives their full subtotal. The choice is locked in per order line at
-- checkout time (fee_passed_to_customer on marketplace_order_items), not
-- read live at payout time — a business could flip the setting between
-- purchase and delivery (the payout release window alone is 24h+), and a
-- late read would either double-charge the fee or let it vanish.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS marketplace_fee_mode text NOT NULL DEFAULT 'absorb'
    CHECK (marketplace_fee_mode IN ('absorb', 'pass_to_customer'));

ALTER TABLE public.marketplace_order_items
  ADD COLUMN IF NOT EXISTS fee_passed_to_customer boolean NOT NULL DEFAULT false;

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS platform_fee_passed numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.marketplace_orders.platform_fee_passed IS
  'Sum of the marketplace fee collected from the buyer across every seller in this order who has pass_to_customer set, in addition to delivery_fee. Informational/receipt use; the per-seller source of truth is marketplace_order_items.fee_passed_to_customer.';

ALTER TABLE public.marketplace_order_payouts
  ADD COLUMN IF NOT EXISTS fee_passed_to_customer boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.marketplace_order_payouts.fee_passed_to_customer IS
  'Snapshotted by handle_marketplace_order_delivered() from marketplace_order_items at delivery time. When true, process-payouts skips the commission deduction — it was already collected from the buyer at checkout.';

-- Same function as 20260831000000_add_order_fulfillments.sql, replaced to
-- also snapshot fee_passed_to_customer onto the payout row.
CREATE OR REPLACE FUNCTION public.handle_marketplace_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_hours integer;
  order_subtotal numeric;
  fee_passed boolean;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;

    SELECT payout_release_window_hours INTO window_hours FROM public.platform_settings WHERE id = true;
    window_hours := COALESCE(window_hours, 24);

    SELECT COALESCE(SUM(unit_price * qty), 0), COALESCE(bool_or(fee_passed_to_customer), false)
      INTO order_subtotal, fee_passed
    FROM public.marketplace_order_items
    WHERE order_id = NEW.order_id AND business_id = NEW.business_id;

    INSERT INTO public.marketplace_order_payouts
      (order_id, business_id, subtotal, fee_passed_to_customer, payout_status, payout_eligible_at)
    VALUES
      (NEW.order_id, NEW.business_id, order_subtotal, fee_passed, 'pending', NEW.delivered_at + (window_hours || ' hours')::interval)
    ON CONFLICT (order_id, business_id) DO UPDATE
      SET payout_eligible_at = EXCLUDED.payout_eligible_at,
          fee_passed_to_customer = EXCLUDED.fee_passed_to_customer,
          payout_status = CASE WHEN public.marketplace_order_payouts.payout_status = 'not_eligible'
                                THEN 'pending' ELSE public.marketplace_order_payouts.payout_status END,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;
