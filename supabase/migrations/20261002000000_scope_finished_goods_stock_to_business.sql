-- apply_finished_goods_stock has been SECURITY DEFINER since
-- 20260812000000_fix_production_schema.sql with no tenant check at all: it
-- took only a product id and updated that row, bypassing RLS. Any
-- authenticated user could raise or lower any other business's stock by
-- passing its product id.
--
-- Same shape as the guard on apply_product_order_stock: take the business id,
-- verify the caller belongs to it, and scope the UPDATE to it as well.

DROP FUNCTION IF EXISTS public.apply_finished_goods_stock(uuid, integer);

CREATE OR REPLACE FUNCTION public.apply_finished_goods_stock(
  p_product_id      uuid,
  p_quantity_added  integer,
  p_business_id     uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock integer;
  v_new   integer;
BEGIN
  IF p_business_id IS NULL
     OR p_business_id NOT IN (SELECT public.my_business_ids()) THEN
    RAISE EXCEPTION 'Not a member of business %', p_business_id
      USING ERRCODE = '42501';
  END IF;

  SELECT stock_quantity
    INTO v_stock
    FROM public.products
   WHERE id = p_product_id
     AND business_id = p_business_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % does not belong to business %', p_product_id, p_business_id
      USING ERRCODE = '42501';
  END IF;

  v_new := COALESCE(v_stock, 0) + p_quantity_added;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: % unit(s) available', COALESCE(v_stock, 0)
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.products
     SET stock_quantity = v_new,
         updated_at = now()
   WHERE id = p_product_id
     AND business_id = p_business_id;

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_finished_goods_stock(uuid, integer, uuid) TO authenticated;
