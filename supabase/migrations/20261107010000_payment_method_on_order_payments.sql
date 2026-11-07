-- Deposit and balance payments were saved with payment_method 'deposit' /
-- 'balance' (copies of the source), never how the customer actually paid.
-- Both functions now take the real method; calls without one store NULL.

DROP FUNCTION IF EXISTS public.post_order_deposit_payment(uuid, uuid);
DROP FUNCTION IF EXISTS public.post_order_completion_payment(uuid, uuid);

-- Posts the order's deposit as a payment once, when the order is created
-- with one. Idempotent via payments_order_id_source_auto_idx.
CREATE OR REPLACE FUNCTION public.post_order_deposit_payment(
  p_order_id       uuid,
  p_business_id    uuid,
  p_payment_method text DEFAULT NULL
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
    (p_business_id, p_order_id, CURRENT_DATE, v_order.deposit, NULLIF(trim(p_payment_method), ''), 'deposit',
     format('Deposit for Order #%s', v_order.order_number));

  RETURN 1;
END;
$$;

-- Posts the order's remaining balance (total_cost - deposit) as a payment
-- once, when the order is completed. Idempotent via
-- payments_order_id_source_auto_idx.
CREATE OR REPLACE FUNCTION public.post_order_completion_payment(
  p_order_id       uuid,
  p_business_id    uuid,
  p_payment_method text DEFAULT NULL
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

  v_amount := COALESCE(v_order.total_cost, 0) - COALESCE(v_order.deposit, 0);

  IF v_amount <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.payments
    (business_id, order_id, payment_date, amount, payment_method, source, notes)
  VALUES
    (p_business_id, p_order_id, CURRENT_DATE, v_amount, NULLIF(trim(p_payment_method), ''), 'balance',
     format('Balance for Order #%s', v_order.order_number));

  RETURN 1;
END;
$$;

UPDATE public.payments
   SET payment_method = NULL
 WHERE source IN ('deposit', 'balance')
   AND payment_method IN ('deposit', 'balance');
