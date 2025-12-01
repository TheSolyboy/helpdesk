-- Storage bucket policies for "ticket images" bucket
-- Bucket name: ticket images (should already be created via Supabase Dashboard)

-- Policy 1: Allow anyone to upload images (INSERT)
-- This allows public users to upload images when creating tickets
CREATE POLICY "Allow public upload to ticket images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'ticket images');

-- Policy 2: Allow authenticated users (staff) to view images (SELECT)
-- This allows admins and agents to view ticket images
CREATE POLICY "Allow authenticated users to view ticket images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ticket images');

-- Policy 3: Allow public users to view images (SELECT)
-- Optional: Enable this if you want ticket creators to be able to view their uploaded images
-- Uncomment the following lines if needed:
-- CREATE POLICY "Allow public to view ticket images"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'ticket images');

-- Note: Make sure the bucket "ticket images" is created in Supabase Dashboard
-- Storage settings should be:
-- - Public: No (controlled by policies)
-- - File size limit: Recommended 5MB per file
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
