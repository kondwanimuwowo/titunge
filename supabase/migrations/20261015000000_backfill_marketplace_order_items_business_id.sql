-- createPendingOrderAction (src/app/actions/marketplace-checkout.ts) has
-- always inserted marketplace_order_items without business_id, even though
-- the whole payout pipeline depends on it: createFulfillmentRowsForOrder
-- only picks up items WHERE business_id IS NOT NULL, so no fulfillment rows
-- were ever created, so handle_marketplace_order_delivered never fired, so
-- no marketplace_order_payouts rows exist for any order placed before this
-- fix. This backfills the column from products.business_id so historical
-- orders read correctly; it does NOT create the missing fulfillment/payout
-- rows for already-delivered orders, since doing that would make them
-- eligible for a real Lenco transfer the next time process-payouts runs —
-- that needs a deliberate, separate decision, not a silent side effect of
-- a data-correction migration.

UPDATE public.marketplace_order_items AS items
SET business_id = products.business_id
FROM public.products
WHERE products.id = items.product_id
  AND items.business_id IS NULL;
