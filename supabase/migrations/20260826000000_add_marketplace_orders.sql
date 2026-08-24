-- Real order persistence for the public marketplace, needed now that Lenco
-- payments attach to a durable order instead of a localStorage-only cart.
-- Buyers here are anonymous (no marketplace buyer-login system), so access
-- is capability-based (knowing the order id/reference) rather than
-- identity-based — all reads/writes go through server code using the
-- service-role client, same as customer_inquiries and the invite-token flow.

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      text NOT NULL UNIQUE,
  buyer_name        text NOT NULL,
  buyer_email       text,
  buyer_phone       text NOT NULL,
  shipping_address  jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal          numeric NOT NULL,
  delivery_fee      numeric NOT NULL DEFAULT 0,
  total             numeric NOT NULL,
  currency          text NOT NULL DEFAULT 'ZMW',
  status            text NOT NULL DEFAULT 'awaiting_payment'
                      CHECK (status IN ('awaiting_payment','being_sewn','shipped','delivered','cancelled')),
  payment_status    text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','successful','failed')),
  payment_method    text CHECK (payment_method IN ('mobile-money','card')),
  payment_reference text NOT NULL UNIQUE,
  lenco_reference   text,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.products(id) ON DELETE SET NULL,
  business_id   uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  seller_name   text NOT NULL,
  image_url     text,
  size          text,
  qty           integer NOT NULL DEFAULT 1,
  unit_price    numeric NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

-- No public policy — the public checkout/order-lookup path always goes
-- through the service-role client, deliberately bypassing RLS (same
-- reasoning as the marketplace product catalog read path). These policies
-- exist only so a future seller-facing "orders containing my products"
-- view can be built without a schema change.
DROP POLICY IF EXISTS tenant_isolation ON public.marketplace_order_items;
CREATE POLICY tenant_isolation ON public.marketplace_order_items
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_reference ON public.marketplace_orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payment_status ON public.marketplace_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON public.marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_business ON public.marketplace_order_items(business_id);
