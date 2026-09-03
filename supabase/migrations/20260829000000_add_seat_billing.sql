-- Recurring Team-plan seat billing (K250/additional seat/month). Reuses the
-- existing cron-jobs.org + secret-protected-route pattern (see
-- process-payouts/verify-payouts) instead of a new scheduling dependency.

CREATE TABLE IF NOT EXISTS public.business_billing_profiles (
  business_id     uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_method  text CHECK (payment_method IN ('mobile-money', 'card')),
  account_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.business_billing_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.business_billing_profiles;
CREATE POLICY tenant_isolation ON public.business_billing_profiles
  USING (business_id IN (SELECT public.my_business_ids()));

CREATE TABLE IF NOT EXISTS public.business_billing_charges (
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

CREATE INDEX IF NOT EXISTS idx_business_billing_charges_status
  ON public.business_billing_charges(status);

ALTER TABLE public.business_billing_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.business_billing_charges;
CREATE POLICY tenant_isolation ON public.business_billing_charges
  USING (business_id IN (SELECT public.my_business_ids()));
