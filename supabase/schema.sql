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
  order_prefix     text NOT NULL DEFAULT 'ORD', -- e.g. "GD" → orders like GD-001
  currency         text NOT NULL DEFAULT 'ZMW',
  timezone         text NOT NULL DEFAULT 'Africa/Lusaka',
  plan             text NOT NULL DEFAULT 'starter', -- starter | pro | enterprise
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
  employee_id      uuid REFERENCES public.employees(id),
  garment_type_id  uuid REFERENCES public.garment_types(id),
  order_type       text,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','production','ready','completed','delivered','cancelled')),
  order_date       date DEFAULT CURRENT_DATE,
  due_date         date,
  total_cost       numeric DEFAULT 0,
  material_cost    numeric DEFAULT 0,
  labour_cost      numeric DEFAULT 0,
  overhead_cost    numeric DEFAULT 0,
  deposit          numeric DEFAULT 0,
  balance_due      numeric DEFAULT 0,
  notes            text,
  style_notes      text,
  measurements     jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz,
  UNIQUE(business_id, order_number)
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

-- user_profiles: users can read/update their own profile
CREATE POLICY "own_profile" ON public.user_profiles
  FOR ALL USING (id = auth.uid());

-- Generic tenant isolation policy for all data tables
-- (applied to every table that has business_id)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','employees','attendance','garment_types','orders','products',
    'materials','inventory_transactions','order_materials',
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

-- ============================================================
-- SEED: Gloriaz Daughter as tenant #1
-- (data will be migrated from the standalone GD project later)
-- ============================================================

INSERT INTO public.businesses (name, slug, order_prefix, currency, timezone)
VALUES ('Gloriaz Daughter', 'gloriaz-daughter', 'GD', 'ZMW', 'Africa/Lusaka');
