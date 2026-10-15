-- #8 of the Zozo Couture feedback list: UK/US/AUS sizing conventions for S/M/L
-- labels differ, and the client asked whether the system could account for
-- that. Converting sizes automatically needs real per-garment conversion
-- data the system doesn't have, and this is a made-to-measure business
-- where S/M/L is informational at best. Simplest honest fix: let each
-- seller declare which convention their own labels follow, shown next to
-- the size picker on the storefront, same pattern as marketplace_fee_mode.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS sizing_standard text NOT NULL DEFAULT 'not_specified'
    CHECK (sizing_standard IN ('not_specified', 'uk', 'us', 'aus'));

COMMENT ON COLUMN public.businesses.sizing_standard IS
  'Which sizing convention this seller''s S/M/L (etc) product labels follow. Informational only — shown on the storefront, never converts a size value.';
