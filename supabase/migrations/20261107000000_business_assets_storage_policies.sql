-- Logo and shop banner uploads failed with "new row violates row-level
-- security policy": the business-assets policies only ever lived in
-- schema.sql, never in a migration. They're recreated here, scoped so a user
-- can only write inside the folder of a business they belong to
-- ({business_id}/logo.png, {business_id}/storefront-banner.jpg).

-- Banners may be up to 4 MB (uploadStorefrontBannerAction); logos stay at 2 MB in code.
update storage.buckets set file_size_limit = 4194304 where id = 'business-assets';

drop policy if exists "Authenticated users can upload business assets" on storage.objects;
drop policy if exists "Authenticated users can update their business assets" on storage.objects;
drop policy if exists "Business assets are publicly readable" on storage.objects;
drop policy if exists "Members can upload their business assets" on storage.objects;
drop policy if exists "Members can update their business assets" on storage.objects;
drop policy if exists "Members can delete their business assets" on storage.objects;

create policy "Business assets are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'business-assets');

create policy "Members can upload their business assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (select public.my_business_ids()::text)
  );

create policy "Members can update their business assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (select public.my_business_ids()::text)
  )
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (select public.my_business_ids()::text)
  );

create policy "Members can delete their business assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (select public.my_business_ids()::text)
  );
