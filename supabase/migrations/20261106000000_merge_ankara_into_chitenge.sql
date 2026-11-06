-- "Ankara fabric" and "Chitenge" are the same wax print; the marketplace keeps
-- Chitenge only. Move any products tagged with the removed category.
update product_storefront_extra
set category_slug = 'chitenge'
where category_slug = 'ankara-fabric';
