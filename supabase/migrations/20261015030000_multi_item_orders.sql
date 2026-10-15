-- Lets one order hold several garments/products instead of exactly one
-- (Odoo POS-style "add item, add another, check out once"). order_items
-- already existed in the schema but nothing ever wrote to it — this fills
-- it out into the real line-items table and wires order_materials to it.
--
-- orders.total_cost/material_cost/labour_cost stay as the source of truth
-- for Finance, receipts, and the payment-posting RPCs added earlier — they
-- become a rollup of this order's items rather than a single garment's
-- numbers, so nothing downstream of those columns needs to change.
-- orders.garment_type_id/product_id are left in place (both already
-- nullable) for orders created before this migration, which keep reading
-- exactly as they always have; new orders simply leave them null and use
-- order_items instead.

ALTER TABLE public.order_items
  RENAME COLUMN price TO unit_price;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS garment_type_id uuid REFERENCES public.garment_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labour_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS style_notes text;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_item_type_check CHECK (item_type IN ('ready_made', 'custom'));

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_business_id ON public.order_items(business_id);

ALTER TABLE public.order_materials
  ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_order_materials_order_item_id ON public.order_materials(order_item_id);

-- order_items already has RLS enabled and a tenant_isolation policy from the
-- base schema (schema.sql's generic per-table policy loop) — nothing to add.
