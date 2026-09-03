-- Platform-admin identity (Titunge staff, not a business role) + a single
-- platform-wide settings row driving marketplace commission/payout timing
-- and Team-plan seat pricing. Also normalizes businesses.plan onto the
-- real two-tier pricing (free | team) instead of the old starter/pro/enterprise
-- placeholder that no code ever read.

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- No public RLS policy — platform-admin membership is only ever checked
-- server-side via the service-role client, same treatment as other
-- privileged tables in this schema.
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                           boolean PRIMARY KEY DEFAULT true CHECK (id),
  commission_rate              numeric NOT NULL DEFAULT 0.10,
  payout_release_window_hours  integer NOT NULL DEFAULT 24,
  max_payout_retries           integer NOT NULL DEFAULT 3,
  seat_price_kwacha            numeric NOT NULL DEFAULT 250,
  updated_at                   timestamptz DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated business context — needed so seller/business
-- UI can display real fee/commission figures rather than hardcoding them.
-- Writes are never done through this policy: the settings form always goes
-- through the service-role client after a requirePlatformAdminContext() check.
DROP POLICY IF EXISTS "authenticated_read_platform_settings" ON public.platform_settings;
CREATE POLICY "authenticated_read_platform_settings" ON public.platform_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Normalize the old starter/pro/enterprise placeholder onto free/team.
UPDATE public.businesses SET plan = 'free' WHERE plan = 'starter';
UPDATE public.businesses SET plan = 'team' WHERE plan IN ('pro', 'enterprise');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_plan_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_plan_check CHECK (plan IN ('free', 'team'));
  END IF;
END;
$$;

COMMENT ON COLUMN public.businesses.plan IS 'free | team — free is 1 seat, team is pay-per-additional-seat (see platform_settings.seat_price_kwacha)';
