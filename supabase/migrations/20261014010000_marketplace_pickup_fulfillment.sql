-- Checkout always charged delivery and had no pickup option
-- (src/app/actions/marketplace-checkout.ts previously hardcoded
-- deliveryFee = DELIVERY_FEE_ZMW). Lets a buyer whose cart is entirely from
-- one seller skip delivery and pick up from the store instead.

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS fulfillment_method text NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_method IN ('delivery', 'pickup'));

COMMENT ON COLUMN public.marketplace_orders.fulfillment_method IS
  'pickup is only offered client-side when every line in the order shares one seller, and re-validated server-side in createPendingOrderAction before it waives the delivery fee.';
