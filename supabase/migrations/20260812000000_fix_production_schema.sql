-- Restores the production-tracking schema depth (batch product/quantity/costing,
-- stage tracking, material costing, audit log) that existed in the original
-- single-tenant gloriaz-daughter app but was dropped when production_batches
-- was simplified for the multi-tenant migration. The application code
-- (ProductionList, BatchDetailsView, CreateBatchForm, production actions) was
-- carried over unchanged and still expects this shape, so every batch query
-- was failing with "column/relationship does not exist".

ALTER TABLE public.production_batches
  ADD COLUMN product_id    uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN quantity      integer,
  ADD COLUMN started_at    timestamptz,
  ADD COLUMN completed_at  timestamptz,
  ADD COLUMN deleted_at    timestamptz,
  ADD COLUMN labor_cost    numeric DEFAULT 0,
  ADD COLUMN material_cost numeric DEFAULT 0,
  ADD COLUMN total_cost    numeric DEFAULT 0;

CREATE INDEX idx_production_batches_product ON public.production_batches(product_id);

CREATE TABLE public.production_stages (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id         uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  stage_name       text NOT NULL,
  assigned_to      uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status           text DEFAULT 'pending',
  started_at       timestamptz,
  completed_at     timestamptz,
  notes            text,
  quality_issues   text,
  input_data       jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE public.production_materials (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id         uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  material_id      uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  quantity_used    numeric NOT NULL,
  cost             numeric NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- user_id points at user_profiles (not auth.users) so PostgREST can embed
-- it directly in getBatchById's select, same reasoning as business_users.
CREATE TABLE public.production_logs (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id         uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action           text NOT NULL,
  details          text,
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.production_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs      ENABLE ROW LEVEL SECURITY;

-- These child tables have no business_id column of their own (the app never
-- sets one on insert), so tenant isolation is enforced via their batch's
-- business_id instead of the usual direct-column policy.
CREATE POLICY tenant_isolation ON public.production_stages
  USING (batch_id IN (SELECT id FROM public.production_batches WHERE business_id IN (SELECT public.my_business_ids())));

CREATE POLICY tenant_isolation ON public.production_materials
  USING (batch_id IN (SELECT id FROM public.production_batches WHERE business_id IN (SELECT public.my_business_ids())));

CREATE POLICY tenant_isolation ON public.production_logs
  USING (batch_id IN (SELECT id FROM public.production_batches WHERE business_id IN (SELECT public.my_business_ids())));

CREATE INDEX idx_production_stages_batch ON public.production_stages(batch_id);
CREATE INDEX idx_production_materials_batch ON public.production_materials(batch_id);
CREATE INDEX idx_production_logs_batch ON public.production_logs(batch_id);

-- Atomically increments finished-goods stock when a batch completes.
-- SECURITY DEFINER so employees without direct product write access can
-- still complete a batch (see updateBatchStatusAction).
CREATE OR REPLACE FUNCTION public.apply_finished_goods_stock(p_product_id uuid, p_quantity_added integer)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity_added,
      updated_at = now()
  WHERE id = p_product_id;
$$;
