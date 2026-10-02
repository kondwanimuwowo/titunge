-- Port of the three client-reported fixes from the single-tenant app
-- (gloriaz-daughter, commit 0f13733), adapted for multi-tenancy.
--
-- 1. Labour cost always came out at the same figure on any order without a
--    garment type, because the order forms fell back to
--    `custom_hourly_rate * 2` with the hours hardcoded. The hours become a
--    per-business financial setting.
--
-- 2. Material and labour costs of a completed order had to be keyed into
--    Finance > Expenses by hand. post_order_completion_expenses() posts both
--    lines once, on completion. They are flagged `auto_generated` so the
--    finance summary can keep deriving material/labour from the orders table
--    without double-counting them as expenses.
--
-- 3. Ordering a finished good did not decrement products.stock_quantity.
--    apply_product_order_stock() moves one unit and writes an
--    inventory_transactions row when an order reaches a confirmed status.
--
-- Both functions are SECURITY DEFINER so they can hold a row lock and write
-- the stock change and its ledger row in one statement. Because that bypasses
-- RLS, each one takes the business id explicitly and checks three things: the
-- caller belongs to that business, and the order and product both belong to it
-- too. Without those checks a tenant could pass another tenant's id and move
-- their stock — see apply_finished_goods_stock, which predates this and has no
-- such guard.

-- 1. Configurable default labour hours ------------------------------------

ALTER TABLE public.financial_settings
  ADD COLUMN IF NOT EXISTS default_labour_hours numeric NOT NULL DEFAULT 2
    CHECK (default_labour_hours >= 0);

COMMENT ON COLUMN public.financial_settings.default_labour_hours IS
  'Hours multiplied by custom_hourly_rate to estimate labour on an order with no garment type.';

-- 2. Auto-posted order expenses -------------------------------------------

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.expenses.auto_generated IS
  'True for expenses posted by the system on order completion. Excluded from the finance summary expense total, which already derives material/labour from orders.';

-- Unique, so the idempotency is the database's guarantee and not a matter of
-- timing: the EXISTS check below still short-circuits the normal path, but two
-- concurrent completions can no longer both get past it. One Materials row and
-- one Labor row per order, so (order_id, category) is the natural key.
CREATE UNIQUE INDEX IF NOT EXISTS expenses_order_id_category_auto_idx
  ON public.expenses (order_id, category) WHERE auto_generated;

CREATE OR REPLACE FUNCTION public.post_order_completion_expenses(
  p_order_id    uuid,
  p_business_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order   record;
  v_created integer := 0;
BEGIN
  IF p_business_id IS NULL
     OR p_business_id NOT IN (SELECT public.my_business_ids()) THEN
    RAISE EXCEPTION 'Not a member of business %', p_business_id
      USING ERRCODE = '42501';
  END IF;

  SELECT id, order_number, material_cost, labour_cost
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     AND business_id = p_business_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Idempotent: completing an order twice must not post the costs twice.
  IF EXISTS (
    SELECT 1 FROM public.expenses
     WHERE order_id = p_order_id AND auto_generated
  ) THEN
    RETURN 0;
  END IF;

  IF COALESCE(v_order.material_cost, 0) > 0 THEN
    INSERT INTO public.expenses
      (business_id, expense_date, category, description, amount, order_id,
       auto_generated, notes)
    VALUES
      (p_business_id, CURRENT_DATE, 'Materials',
       format('Materials - Order #%s', v_order.order_number),
       v_order.material_cost, p_order_id, true,
       'Posted automatically when the order was completed');
    v_created := v_created + 1;
  END IF;

  IF COALESCE(v_order.labour_cost, 0) > 0 THEN
    INSERT INTO public.expenses
      (business_id, expense_date, category, description, amount, order_id,
       auto_generated, notes)
    VALUES
      (p_business_id, CURRENT_DATE, 'Labor',
       format('Labour - Order #%s', v_order.order_number),
       v_order.labour_cost, p_order_id, true,
       'Posted automatically when the order was completed');
    v_created := v_created + 1;
  END IF;

  RETURN v_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_order_completion_expenses(uuid, uuid) TO authenticated;

-- 3. Product stock movement on order ---------------------------------------

-- The ledger was material-only, so material_id has to give up its NOT NULL to
-- hold a product movement. The check keeps every row pointing at exactly one
-- of the two, so a row can never be ambiguous or empty.
-- ON DELETE CASCADE to match material_id. Without it a product that ever moved
-- stock could never be hard-deleted. SET NULL is not an option: it would leave
-- the row with neither subject and break the check below.
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_transactions
  ALTER COLUMN material_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'inventory_transactions_subject_chk'
  ) THEN
    ALTER TABLE public.inventory_transactions
      ADD CONSTRAINT inventory_transactions_subject_chk
      CHECK ((material_id IS NOT NULL) <> (product_id IS NOT NULL));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS inventory_transactions_product_id_idx
  ON public.inventory_transactions (product_id) WHERE product_id IS NOT NULL;

-- Returns the new stock level, or NULL when the product is not stock-tracked
-- (a custom design is made to order, so it has no stock to move).
CREATE OR REPLACE FUNCTION public.apply_product_order_stock(
  p_product_id      uuid,
  p_order_id        uuid,
  p_business_id     uuid,
  p_quantity_change integer,
  p_operation_type  text,
  p_notes           text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type  text;
  v_stock integer;
  v_new   integer;
BEGIN
  IF p_business_id IS NULL
     OR p_business_id NOT IN (SELECT public.my_business_ids()) THEN
    RAISE EXCEPTION 'Not a member of business %', p_business_id
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders
     WHERE id = p_order_id AND business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Order % does not belong to business %', p_order_id, p_business_id
      USING ERRCODE = '42501';
  END IF;

  SELECT product_type, stock_quantity
    INTO v_type, v_stock
    FROM public.products
   WHERE id = p_product_id
     AND business_id = p_business_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % does not belong to business %', p_product_id, p_business_id
      USING ERRCODE = '42501';
  END IF;

  IF v_type IS DISTINCT FROM 'finished_good' OR v_stock IS NULL THEN
    RETURN NULL;
  END IF;

  v_new := v_stock + p_quantity_change;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: % unit(s) available', v_stock
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.products
     SET stock_quantity = v_new,
         updated_at = now()
   WHERE id = p_product_id
     AND business_id = p_business_id;

  INSERT INTO public.inventory_transactions
    (business_id, product_id, order_id, quantity_change, operation_type, notes)
  VALUES
    (p_business_id, p_product_id, p_order_id, p_quantity_change, p_operation_type, p_notes);

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_product_order_stock(uuid, uuid, uuid, integer, text, text) TO authenticated;
