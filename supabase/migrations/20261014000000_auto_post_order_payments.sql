-- The `payments` table is Finance > Payments' and Cash Flow's only data
-- source (see fetchFinanceSummary / fetchPayments in src/lib/data/finance.ts),
-- but nothing in the app has ever inserted a row into it — deposits taken at
-- order creation and balances settled on completion both go unrecorded, so
-- Payments and Cash Flow read zero regardless of how much money has actually
-- changed hands. This mirrors the post_order_completion_expenses() pattern
-- (20261001010000) to post the two payment events the orders table already
-- captures: the deposit, and the balance on completion.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'deposit', 'balance'));

COMMENT ON COLUMN public.payments.source IS
  'manual = entered by hand; deposit/balance = posted automatically from the orders table. Excludes manual entries from the idempotency check below.';

-- One deposit payment and one balance payment per order, same guarantee as
-- the expenses unique index: the database enforces it, not call-site timing.
CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_source_auto_idx
  ON public.payments (order_id, source) WHERE source <> 'manual';

CREATE OR REPLACE FUNCTION public.post_order_deposit_payment(
  p_order_id    uuid,
  p_business_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
BEGIN
  IF p_business_id IS NULL
     OR p_business_id NOT IN (SELECT public.my_business_ids()) THEN
    RAISE EXCEPTION 'Not a member of business %', p_business_id
      USING ERRCODE = '42501';
  END IF;

  SELECT id, order_number, deposit
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     AND business_id = p_business_id;

  IF NOT FOUND OR COALESCE(v_order.deposit, 0) <= 0 THEN
    RETURN 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
     WHERE order_id = p_order_id AND source = 'deposit'
  ) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.payments
    (business_id, order_id, payment_date, amount, payment_method, source, notes)
  VALUES
    (p_business_id, p_order_id, CURRENT_DATE, v_order.deposit, 'deposit', 'deposit',
     format('Deposit — Order #%s', v_order.order_number));

  RETURN 1;
END;
$$;

COMMENT ON FUNCTION public.post_order_deposit_payment(uuid, uuid) IS
  'Posts the order''s deposit as a payment once, when the order is created with one. Idempotent via payments_order_id_source_auto_idx.';

CREATE OR REPLACE FUNCTION public.post_order_completion_payment(
  p_order_id    uuid,
  p_business_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order  record;
  v_amount numeric;
BEGIN
  IF p_business_id IS NULL
     OR p_business_id NOT IN (SELECT public.my_business_ids()) THEN
    RAISE EXCEPTION 'Not a member of business %', p_business_id
      USING ERRCODE = '42501';
  END IF;

  SELECT id, order_number, total_cost, deposit
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     AND business_id = p_business_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
     WHERE order_id = p_order_id AND source = 'balance'
  ) THEN
    RETURN 0;
  END IF;

  -- The balance settled on completion is whatever is left after the deposit,
  -- not the full order total — avoids double-counting a deposit already
  -- posted by post_order_deposit_payment().
  v_amount := COALESCE(v_order.total_cost, 0) - COALESCE(v_order.deposit, 0);

  IF v_amount <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.payments
    (business_id, order_id, payment_date, amount, payment_method, source, notes)
  VALUES
    (p_business_id, p_order_id, CURRENT_DATE, v_amount, 'balance', 'balance',
     format('Balance — Order #%s', v_order.order_number));

  RETURN 1;
END;
$$;

COMMENT ON FUNCTION public.post_order_completion_payment(uuid, uuid) IS
  'Posts the order''s remaining balance (total_cost - deposit) as a payment once, when the order is completed. Idempotent via payments_order_id_source_auto_idx.';
