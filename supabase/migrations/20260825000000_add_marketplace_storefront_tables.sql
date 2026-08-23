-- Marketplace-only display data (seller bio/policies, product care/shipping/
-- category mapping) lives in dedicated tables rather than on businesses/products
-- directly, so plain ERP-only tenants never carry storefront-specific columns.
-- The public marketplace read path never uses the RLS policies below — it goes
-- through the service-role client (src/lib/marketplace-db.ts), since these rows
-- must be readable cross-tenant by anonymous visitors and no anon policy exists
-- on tenant tables in this schema. The policies here are only for the (future)
-- tenant-side editing UI.

CREATE TABLE IF NOT EXISTS public.business_storefront (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id          uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  bio                  text,
  banner_url           text,
  location             text,
  founded_year         integer,
  delivery_policy      text,
  returns_policy       text,
  custom_orders_policy text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_storefront_extra (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id         uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  category_slug      text,   -- maps into the fixed marketplace taxonomy (src/data/marketplace-categories.ts); null = shows in "all" only
  care_instructions  text,
  shipping_lead_time text,
  featured           boolean DEFAULT false,  -- lets homepage "Featured" pick real curated items; falls back to newest
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE public.business_storefront      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_storefront_extra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.business_storefront;
CREATE POLICY tenant_isolation ON public.business_storefront
  USING (business_id IN (SELECT public.my_business_ids()));

-- product_storefront_extra has no business_id column of its own — scope
-- tenant isolation through the product's business_id instead (same pattern
-- as order_items/production_stages).
DROP POLICY IF EXISTS tenant_isolation ON public.product_storefront_extra;
CREATE POLICY tenant_isolation ON public.product_storefront_extra
  USING (product_id IN (SELECT id FROM public.products WHERE business_id IN (SELECT public.my_business_ids())));

CREATE INDEX IF NOT EXISTS idx_product_storefront_extra_product ON public.product_storefront_extra(product_id);
