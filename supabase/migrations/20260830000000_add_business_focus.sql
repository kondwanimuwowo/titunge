-- Distinguishes a business that wants the full tailoring ERP from one that
-- only wants a marketplace shop (fewer sidebar links, decluttered onboarding
-- default). Purely a UI preference, not a hard restriction — nothing is
-- gated server-side by this, and it's editable later from Settings.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS focus text NOT NULL DEFAULT 'full_erp';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_focus_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_focus_check CHECK (focus IN ('full_erp', 'marketplace_only'));
  END IF;
END;
$$;
