-- The marketplace taxonomy (src/data/marketplace-categories.ts) drops
-- "ready-to-wear" in favour of who/what categories (women's wear, men's wear,
-- suits, shoes, uniforms and more). Re-tag existing products.

-- Shoes get their own category.
update product_storefront_extra pse
set category_slug = 'shoes', updated_at = now()
from products p
where pse.product_id = p.id
  and pse.category_slug in ('ready-to-wear', 'accessories')
  and p.category ilike 'shoes';

update product_storefront_extra pse
set category_slug = case
    when p.category ilike 'suits' then 'suits'
    when b.slug = 'kayz-suits' then 'mens-wear'
    when b.slug = 'gloriaz-daughter' then 'womens-wear'
    else null  -- unknown audience: listed under "All" until the seller picks one
  end,
  updated_at = now()
from products p
join businesses b on b.id = p.business_id
where pse.product_id = p.id
  and pse.category_slug = 'ready-to-wear';
