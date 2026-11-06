-- Marketplace is Zambia-only at launch. Sellers pick a province so buyers can
-- filter "Ships from" by province; `location` stays as the free-text town/area.

ALTER TABLE public.business_storefront
  ADD COLUMN IF NOT EXISTS province text
    CHECK (province IS NULL OR province IN (
      'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka',
      'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'
    ));
