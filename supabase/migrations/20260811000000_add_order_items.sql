CREATE TABLE public.order_items (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id         uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type        text NOT NULL,
  description      text,
  quantity         integer DEFAULT 1,
  price            numeric NOT NULL DEFAULT 0,
  measurements     jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.order_items
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_business ON public.order_items(business_id);
