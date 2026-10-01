-- Product images moved to Cloudflare R2 (PRODUCT_IMAGES binding, see
-- src/lib/r2.ts). Supabase Storage now holds only business logos
-- (business-assets) and profile avatars, which this migration adds.
--
-- The legacy `product-images` bucket is intentionally left in place: images
-- migrated from the single-tenant app are still referenced by products.images
-- and are removed through the legacy path in deleteProductImageAction.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Avatars are keyed `{auth.uid()}/avatar.<ext>` so a user can only write their own
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
