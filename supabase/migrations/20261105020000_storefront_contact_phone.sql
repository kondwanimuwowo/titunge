-- Delivery is arranged directly between buyer and seller after payment, so
-- each shop needs a number the buyer can reach. Collected during onboarding
-- and shown to a buyer only once they've paid.

ALTER TABLE public.business_storefront
  ADD COLUMN IF NOT EXISTS contact_phone text;
