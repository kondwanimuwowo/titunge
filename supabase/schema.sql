-- ============================================================
-- Titunge Multi-Tenant ERP Schema
-- ============================================================
-- Run this in a fresh Supabase project to set up Titunge.
-- Every tenant (business) is isolated via business_id + RLS.
-- Gloriaz Daughter will be seeded as the first tenant.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANT REGISTRY
-- ============================================================

CREATE TABLE public.businesses (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             text NOT NULL,
  slug             text UNIQUE NOT NULL,       -- URL/subdomain identifier e.g. "gloriaz-daughter"
  logo_url         text,
  theme_key        text NOT NULL DEFAULT 'titunge-teal', -- one of 8 preset palette slugs
  order_prefix     text NOT NULL DEFAULT 'ORD', -- e.g. "GD" → orders like GD-001
  currency         text NOT NULL DEFAULT 'ZMW',
  timezone         text NOT NULL DEFAULT 'Africa/Lusaka',
  plan             text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'team')), -- free = 1 seat, team = pay-per-additional-seat
  focus            text NOT NULL DEFAULT 'full_erp' CHECK (focus IN ('full_erp', 'marketplace_only')), -- UI preference only, editable in Settings
  status           text NOT NULL DEFAULT 'active',  -- active | suspended | trial
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ============================================================
-- USER IDENTITY & MEMBERSHIP
-- ============================================================

-- Global user identity — no role here; role is per-business
CREATE TABLE public.user_profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  email            text,
  avatar_url       text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- User ↔ Business membership with per-business role
CREATE TABLE public.business_users (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             text NOT NULL DEFAULT 'employee', -- admin | manager | employee
  active           boolean DEFAULT true,
  joined_at        timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Pending invites: an admin invites an email + role; the invitee logs in or
-- signs up (choosing their own password) via a token link to accept it.
CREATE TABLE public.business_invites (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee')),
  token        uuid NOT NULL DEFAULT uuid_generate_v4(),
  invited_by   uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at   timestamptz DEFAULT now(),
  accepted_at  timestamptz,
  UNIQUE(business_id, email)
);
CREATE UNIQUE INDEX idx_business_invites_token ON public.business_invites(token);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE public.customers (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  phone            text NOT NULL,
  email            text,
  address          text,
  notes            text,
  measurements     jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz
);

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE public.employees (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  role             text,
  phone            text,
  email            text,
  hire_date        date,
  hourly_rate      numeric DEFAULT 0,
  active           boolean DEFAULT true,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE public.attendance (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id      uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  date             date NOT NULL,
  clock_in         timestamp,
  clock_out        timestamp,
  hours_worked     numeric,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- GARMENT TYPES (per tenant — each business sets their own)
-- ============================================================

CREATE TABLE public.garment_types (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  base_labour_cost numeric DEFAULT 0,
  estimated_hours  numeric,
  complexity       text DEFAULT 'standard',
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number     text NOT NULL,
  customer_id      uuid REFERENCES public.customers(id),
  assigned_tailor_id uuid REFERENCES public.employees(id),
  garment_type_id  uuid REFERENCES public.garment_types(id),
  product_id       uuid REFERENCES public.products(id) ON DELETE SET NULL,
  order_type       text,
  status           text NOT NULL DEFAULT 'enquiry'
                     CHECK (status IN (
                       'pending','in_progress','production','ready','completed','delivered','cancelled',
                       'enquiry','contacted','measurements','fitting'
                     )),
  order_date       date DEFAULT CURRENT_DATE,
  due_date         date,
  total_cost       numeric DEFAULT 0,
  material_cost    numeric DEFAULT 0,
  labour_cost      numeric DEFAULT 0,
  overhead_cost    numeric DEFAULT 0,
  deposit          numeric DEFAULT 0,
  balance_due      numeric DEFAULT 0,
  description      text,
  notes            text,
  style_notes      text,
  measurements     jsonb DEFAULT '{}'::jsonb,
  cancellation_reason text,
  cancelled_at     timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz,
  UNIQUE(business_id, order_number)
);

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type    text NOT NULL,
  description  text,
  quantity     integer DEFAULT 1,
  price        numeric NOT NULL DEFAULT 0,
  measurements jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCTS (finished goods catalog per tenant)
-- ============================================================

CREATE TABLE public.products (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  price            numeric NOT NULL DEFAULT 0,
  category         text,
  product_type     text DEFAULT 'finished_good',
  sizes            jsonb DEFAULT '[]'::jsonb,
  colors           jsonb DEFAULT '[]'::jsonb,
  images           jsonb DEFAULT '[]'::jsonb,
  stock_quantity   integer DEFAULT 0,
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz
);

-- Marketplace-only display data — kept off the core products/businesses tables
-- so plain ERP-only tenants never carry storefront-specific columns. The public
-- marketplace read path bypasses RLS entirely via the service-role client
-- (src/lib/marketplace-db.ts); the policies below are only for a future
-- tenant-side editing UI.
CREATE TABLE public.business_storefront (
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

CREATE TABLE public.product_storefront_extra (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id         uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  category_slug      text,
  care_instructions  text,
  shipping_lead_time text,
  featured           boolean DEFAULT false,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- ============================================================
-- INVENTORY (raw materials)
-- ============================================================

CREATE TABLE public.materials (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  unit             text NOT NULL DEFAULT 'metres',
  stock_quantity   numeric DEFAULT 0,
  min_stock_level  numeric DEFAULT 0,
  unit_cost        numeric DEFAULT 0,
  supplier         text,
  notes            text,
  last_restocked   timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE public.inventory_transactions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  material_id      uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  order_id         uuid REFERENCES public.orders(id),
  operation_type   text NOT NULL, -- restock | order_deduction | cancellation_restore | usage | production_use | production_completed
  quantity_change  numeric NOT NULL,
  unit_cost        numeric,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.order_materials (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id         uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id      uuid NOT NULL REFERENCES public.materials(id),
  quantity_used    numeric NOT NULL DEFAULT 0,
  unit_cost        numeric DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCTION BATCHES
-- ============================================================

CREATE TABLE public.production_batches (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  batch_number     text NOT NULL,
  status           text DEFAULT 'pending',
  notes            text,
  deleted_at       timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(business_id, batch_number)
);

CREATE TABLE public.production_batch_orders (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  batch_id         uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  order_id         uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- FINANCE
-- ============================================================

CREATE TABLE public.expenses (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id      uuid REFERENCES public.employees(id),
  order_id         uuid REFERENCES public.orders(id),
  expense_date     date NOT NULL,
  category         text NOT NULL,
  description      text,
  amount           numeric NOT NULL DEFAULT 0,
  payment_method   text,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE public.payments (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id         uuid REFERENCES public.orders(id),
  payment_date     date NOT NULL,
  amount           numeric NOT NULL DEFAULT 0,
  payment_method   text,
  reference_number text,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.overhead_costs (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  month            date NOT NULL,
  category         text NOT NULL,
  description      text,
  amount           numeric NOT NULL DEFAULT 0,
  is_recurring     boolean DEFAULT false,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE public.financial_settings (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  custom_hourly_rate        numeric,
  default_profit_margin     numeric,
  expected_monthly_orders   integer,
  tax_rate                  numeric DEFAULT 0,
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(business_id)
);

-- ============================================================
-- CATALOG & INQUIRIES
-- ============================================================

CREATE TABLE public.catalog_purchases (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id           uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id            uuid REFERENCES public.products(id),
  customer_name         text NOT NULL,
  customer_email        text NOT NULL,
  customer_phone        text,
  amount                numeric NOT NULL,
  currency              text DEFAULT 'ZMW',
  reference             text NOT NULL,
  payment_method        text,
  status                text DEFAULT 'paid',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE public.customer_inquiries (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id               uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id                uuid REFERENCES public.products(id),
  customer_name             text NOT NULL,
  customer_phone            text NOT NULL,
  customer_email            text,
  preferred_size            text,
  custom_measurements_needed boolean DEFAULT false,
  special_requests          text,
  contact_method            text DEFAULT 'whatsapp',
  status                    text DEFAULT 'new',
  staff_notes               text,
  converted_order_id        uuid REFERENCES public.orders(id),
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),
  contacted_at              timestamptz
);

-- ============================================================
-- MARKETPLACE ORDERS (public, cross-tenant, buyer-owned)
-- ============================================================
-- Buyers are anonymous — no marketplace buyer-login system — so access is
-- capability-based (knowing the order id/reference), not identity-based.
-- All reads/writes go through the service-role client.

CREATE TABLE public.marketplace_orders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      text NOT NULL UNIQUE,
  buyer_user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- null for guest checkout
  buyer_name        text NOT NULL,
  buyer_email       text,
  buyer_phone       text NOT NULL,
  shipping_address  jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal          numeric NOT NULL,
  delivery_fee      numeric NOT NULL DEFAULT 0,
  promo_code        text,
  discount_amount   numeric NOT NULL DEFAULT 0,
  total             numeric NOT NULL,
  currency          text NOT NULL DEFAULT 'ZMW',
  status            text NOT NULL DEFAULT 'awaiting_payment'
                      CHECK (status IN ('awaiting_payment','being_sewn','shipped','delivered','cancelled')),
  payment_status    text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','successful','failed')),
  payment_method    text CHECK (payment_method IN ('mobile-money','card')),
  payment_reference text NOT NULL UNIQUE,
  lenco_reference   text,
  paid_at           timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE public.marketplace_order_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.products(id) ON DELETE SET NULL,
  business_id   uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  seller_name   text NOT NULL,
  image_url     text,
  size          text,
  qty           integer NOT NULL DEFAULT 1,
  unit_price    numeric NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_marketplace_orders_buyer_user_id ON public.marketplace_orders(buyer_user_id);

-- First real (non-service-role) read path into marketplace_orders —
-- additive to the "no policy, service-role only" default that still covers
-- every other operation (inserts/updates stay server-action-only).
CREATE POLICY buyer_reads_own_orders ON public.marketplace_orders
  FOR SELECT USING (buyer_user_id = auth.uid());

CREATE TABLE public.marketplace_wishlists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_marketplace_wishlists_user_id ON public.marketplace_wishlists(user_id);

ALTER TABLE public.marketplace_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_wishlist ON public.marketplace_wishlists
  USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text NOT NULL,
  title            text NOT NULL,
  message          text,
  read             boolean DEFAULT false,
  data             jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Pattern: users can only access rows where business_id matches
-- a business they are an active member of.

ALTER TABLE public.businesses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_storefront      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_storefront_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overhead_costs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_purchases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_inquiries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;

-- Helper: returns all business_ids the current user belongs to
CREATE OR REPLACE FUNCTION public.my_business_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.business_users
  WHERE user_id = auth.uid() AND active = true;
$$;

-- businesses: members can read their own business
CREATE POLICY "members_read_own_business" ON public.businesses
  FOR SELECT USING (id IN (SELECT public.my_business_ids()));

-- business_users: users can see memberships of businesses they belong to
CREATE POLICY "members_read_business_users" ON public.business_users
  FOR SELECT USING (business_id IN (SELECT public.my_business_ids()));

-- business_invites: members can see/manage invites for their own business.
-- The invite-acceptance page looks a row up by token via the service-role
-- client (the token itself is the auth), deliberately bypassing this policy.
CREATE POLICY tenant_isolation ON public.business_invites
  USING (business_id IN (SELECT public.my_business_ids()));

-- user_profiles: users can read/update their own profile
CREATE POLICY "own_profile" ON public.user_profiles
  FOR ALL USING (id = auth.uid());

-- user_profiles: users can also read the profile of anyone in a business they belong to
-- (needed so the Users list can show teammates' names, not just their own)
CREATE POLICY "business_mates_read_profiles" ON public.user_profiles
  FOR SELECT USING (
    id IN (SELECT user_id FROM public.business_users WHERE business_id IN (SELECT public.my_business_ids()))
  );

-- Generic tenant isolation policy for all data tables
-- (applied to every table that has business_id)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','employees','attendance','garment_types','orders','products',
    'materials','inventory_transactions','order_materials','order_items',
    'business_storefront',
    'production_batches','production_batch_orders',
    'expenses','payments','overhead_costs','financial_settings',
    'catalog_purchases','customer_inquiries','notifications'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I
       USING (business_id IN (SELECT public.my_business_ids()))',
      t
    );
  END LOOP;
END;
$$;

-- product_storefront_extra has no business_id column of its own — scope
-- tenant isolation through the product's business_id instead.
CREATE POLICY tenant_isolation ON public.product_storefront_extra
  USING (product_id IN (SELECT id FROM public.products WHERE business_id IN (SELECT public.my_business_ids())));

-- marketplace_order_items: no public policy — the checkout/order-lookup path
-- always goes through the service-role client. This exists only so a future
-- seller-facing "orders containing my products" view can be built later.
CREATE POLICY tenant_isolation ON public.marketplace_order_items
  USING (business_id IN (SELECT public.my_business_ids()));

-- ============================================================
-- PLATFORM ADMIN (Titunge staff, not a business role)
-- ============================================================

CREATE TABLE public.platform_admins (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- No public RLS policy — checked only server-side via the service-role client.
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.platform_settings (
  id                           boolean PRIMARY KEY DEFAULT true CHECK (id),
  commission_rate              numeric NOT NULL DEFAULT 0.10,
  payout_release_window_hours  integer NOT NULL DEFAULT 24,
  max_payout_retries           integer NOT NULL DEFAULT 3,
  seat_price_kwacha            numeric NOT NULL DEFAULT 250,
  updated_at                   timestamptz DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (true);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated business context (so seller/business UI can
-- show real fee/commission figures); writes always go through the
-- service-role client after a requirePlatformAdminContext() check.
CREATE POLICY "authenticated_read_platform_settings" ON public.platform_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Marketplace-wide promo codes (not per-seller). Redeemed and recomputed
-- entirely server-side in createPendingOrderAction, same "never trust
-- client-submitted totals" rule already enforced there.
CREATE TABLE public.promo_codes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           text NOT NULL UNIQUE,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses       integer,
  use_count      integer NOT NULL DEFAULT 0,
  expires_at     timestamptz,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- No public RLS policy — service-role only, same treatment as platform_settings writes.
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MARKETPLACE SELLER PAYOUTS
-- ============================================================

CREATE TABLE public.business_payout_profiles (
  business_id       uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  payout_method     text CHECK (payout_method IN ('bank-account', 'mobile-money')),
  account_details   jsonb NOT NULL DEFAULT '{}'::jsonb,
  lenco_recipient_id text,
  verified_at       timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.business_payout_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.business_payout_profiles
  USING (business_id IN (SELECT public.my_business_ids()));

-- Payouts are tracked per seller per order (an order can span multiple
-- sellers — see marketplace_order_items.business_id), not per order.
CREATE TABLE public.marketplace_order_payouts (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  business_id        uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subtotal           numeric NOT NULL,
  platform_fee       numeric,
  lenco_transfer_fee numeric,
  payout_amount      numeric,
  payout_status      text NOT NULL DEFAULT 'not_eligible'
                       CHECK (payout_status IN ('not_eligible', 'pending', 'processing', 'completed', 'failed')),
  payout_reference   text,
  payout_lenco_id    text,
  payout_eligible_at timestamptz,
  payout_retries     integer NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (order_id, business_id)
);

CREATE UNIQUE INDEX idx_marketplace_order_payouts_reference
  ON public.marketplace_order_payouts(payout_reference) WHERE payout_reference IS NOT NULL;
CREATE INDEX idx_marketplace_order_payouts_status
  ON public.marketplace_order_payouts(payout_status, payout_eligible_at);

ALTER TABLE public.marketplace_order_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.marketplace_order_payouts
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE TABLE public.payout_log (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_payout_id  uuid NOT NULL REFERENCES public.marketplace_order_payouts(id) ON DELETE CASCADE,
  amount           numeric,
  platform_fee     numeric,
  lenco_transfer_fee numeric,
  status           text NOT NULL,
  lenco_transfer_id text,
  failure_reason   text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.payout_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.payout_log
  FOR SELECT USING (
    order_payout_id IN (
      SELECT id FROM public.marketplace_order_payouts
      WHERE business_id IN (SELECT public.my_business_ids())
    )
  );

-- Fulfillment is tracked per seller too (marketplace_orders.status alone
-- can't distinguish sellers on a shared order) — sellers write to this
-- table, never to marketplace_orders.status directly.
CREATE TABLE public.marketplace_order_fulfillments (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'being_sewn'
                  CHECK (status IN ('being_sewn', 'shipped', 'delivered')),
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (order_id, business_id)
);

CREATE INDEX idx_marketplace_order_fulfillments_business_id
  ON public.marketplace_order_fulfillments(business_id);

ALTER TABLE public.marketplace_order_fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.marketplace_order_fulfillments
  USING (business_id IN (SELECT public.my_business_ids()));

-- When a seller's own fulfillment row transitions to 'delivered', create/
-- refresh that seller's payout row, eligible payout_release_window_hours
-- later. Driven by the per-seller row, so it can never fire for a seller
-- who hasn't actually delivered anything.
CREATE OR REPLACE FUNCTION public.handle_marketplace_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_hours integer;
  order_subtotal numeric;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;

    SELECT payout_release_window_hours INTO window_hours FROM public.platform_settings WHERE id = true;
    window_hours := COALESCE(window_hours, 24);

    SELECT COALESCE(SUM(unit_price * qty), 0) INTO order_subtotal
    FROM public.marketplace_order_items
    WHERE order_id = NEW.order_id AND business_id = NEW.business_id;

    INSERT INTO public.marketplace_order_payouts (order_id, business_id, subtotal, payout_status, payout_eligible_at)
    VALUES (NEW.order_id, NEW.business_id, order_subtotal, 'pending', NEW.delivered_at + (window_hours || ' hours')::interval)
    ON CONFLICT (order_id, business_id) DO UPDATE
      SET payout_eligible_at = EXCLUDED.payout_eligible_at,
          payout_status = CASE WHEN public.marketplace_order_payouts.payout_status = 'not_eligible'
                                THEN 'pending' ELSE public.marketplace_order_payouts.payout_status END,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_marketplace_order_fulfillment_delivered
  BEFORE UPDATE ON public.marketplace_order_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_marketplace_order_delivered();

-- Keeps marketplace_orders.status as a derived aggregate of per-seller
-- fulfillment, so buyer-facing screens (/my-orders, order confirmation)
-- need no changes: delivered only once every seller has delivered, shipped
-- once every seller has at least shipped, being_sewn otherwise.
CREATE OR REPLACE FUNCTION public.sync_marketplace_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sellers integer;
  delivered_sellers integer;
  shipped_or_further integer;
  current_order_status text;
BEGIN
  SELECT status INTO current_order_status FROM public.marketplace_orders WHERE id = NEW.order_id;
  IF current_order_status IS NULL OR current_order_status IN ('awaiting_payment', 'cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE status = 'delivered'),
         count(*) FILTER (WHERE status IN ('shipped', 'delivered'))
  INTO total_sellers, delivered_sellers, shipped_or_further
  FROM public.marketplace_order_fulfillments
  WHERE order_id = NEW.order_id;

  UPDATE public.marketplace_orders
  SET status = CASE
                  WHEN total_sellers > 0 AND delivered_sellers = total_sellers THEN 'delivered'
                  WHEN total_sellers > 0 AND shipped_or_further = total_sellers THEN 'shipped'
                  ELSE 'being_sewn'
                END,
      delivered_at = CASE WHEN total_sellers > 0 AND delivered_sellers = total_sellers THEN now() ELSE delivered_at END,
      updated_at = now()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_marketplace_order_status
  AFTER INSERT OR UPDATE ON public.marketplace_order_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_marketplace_order_status();

-- ============================================================
-- RECURRING SEAT BILLING (Team plan, K per additional seat/month)
-- ============================================================

CREATE TABLE public.business_billing_profiles (
  business_id     uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_method  text CHECK (payment_method IN ('mobile-money', 'card')),
  account_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.business_billing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.business_billing_profiles
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE TABLE public.business_billing_charges (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period       date NOT NULL,
  seat_count   integer NOT NULL,
  amount       numeric NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed')),
  retry_count  integer NOT NULL DEFAULT 0,
  lenco_reference text UNIQUE,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (business_id, period)
);

CREATE INDEX idx_business_billing_charges_status ON public.business_billing_charges(status);

ALTER TABLE public.business_billing_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.business_billing_charges
  USING (business_id IN (SELECT public.my_business_ids()));

-- ============================================================
-- PERFORMANCE INDEXES
-- Every RLS policy and nearly every application query filters by
-- business_id — skips tables where it's already the primary key or already
-- leads a composite UNIQUE constraint.
-- ============================================================

CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_employees_business_id ON public.employees(business_id);
CREATE INDEX idx_attendance_business_id ON public.attendance(business_id);
CREATE INDEX idx_garment_types_business_id ON public.garment_types(business_id);
CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_order_items_business_id ON public.order_items(business_id);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_materials_business_id ON public.materials(business_id);
CREATE INDEX idx_inventory_transactions_business_id ON public.inventory_transactions(business_id);
CREATE INDEX idx_order_materials_business_id ON public.order_materials(business_id);
CREATE INDEX idx_production_batch_orders_business_id ON public.production_batch_orders(business_id);
CREATE INDEX idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX idx_payments_business_id ON public.payments(business_id);
CREATE INDEX idx_overhead_costs_business_id ON public.overhead_costs(business_id);
CREATE INDEX idx_financial_settings_business_id ON public.financial_settings(business_id);
CREATE INDEX idx_catalog_purchases_business_id ON public.catalog_purchases(business_id);
CREATE INDEX idx_customer_inquiries_business_id ON public.customer_inquiries(business_id);
CREATE INDEX idx_marketplace_order_items_business_id ON public.marketplace_order_items(business_id);
CREATE INDEX idx_notifications_business_id ON public.notifications(business_id);
CREATE INDEX idx_marketplace_order_payouts_business_id ON public.marketplace_order_payouts(business_id);

-- ============================================================
-- STORAGE: Public bucket for business assets (logos, etc.)
-- Run this once in the Supabase Dashboard > Storage, or via CLI:
--   supabase storage create business-assets --public
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  2097152, -- 2 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload to their own business folder
CREATE POLICY "Authenticated users can upload business assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Business assets are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can update their business assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-assets');

-- ============================================================
-- SEED: Gloriaz Daughter as tenant #1
-- (data will be migrated from the standalone GD project later)
-- ============================================================

INSERT INTO public.businesses (name, slug, order_prefix, currency, timezone, theme_key)
VALUES ('Gloriaz Daughter', 'gloriaz-daughter', 'GD', 'ZMW', 'Africa/Lusaka', 'gold-ochre');
