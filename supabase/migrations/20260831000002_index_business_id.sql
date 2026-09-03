-- Every RLS policy and nearly every application query filters by
-- business_id, but almost none of the ~20 tenant tables had an index on it —
-- fine at today's scale, sequential-scan territory as tenants grow. Skips
-- tables where business_id is already the primary key or already leads a
-- composite UNIQUE constraint (business_users, business_invites,
-- business_storefront, production_batches, business_payout_profiles,
-- business_billing_profiles) since those are already indexed for this.

CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON public.employees(business_id);
CREATE INDEX IF NOT EXISTS idx_attendance_business_id ON public.attendance(business_id);
CREATE INDEX IF NOT EXISTS idx_garment_types_business_id ON public.garment_types(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_order_items_business_id ON public.order_items(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_materials_business_id ON public.materials(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_business_id ON public.inventory_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_business_id ON public.order_materials(business_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_orders_business_id ON public.production_batch_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_overhead_costs_business_id ON public.overhead_costs(business_id);
CREATE INDEX IF NOT EXISTS idx_financial_settings_business_id ON public.financial_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_catalog_purchases_business_id ON public.catalog_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_business_id ON public.customer_inquiries(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_business_id ON public.marketplace_order_items(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_payouts_business_id ON public.marketplace_order_payouts(business_id);
