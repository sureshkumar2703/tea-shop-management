-- 021_storage_bucket.sql
-- Create and configure Supabase Storage bucket 'Tea-Shop-Images' for images and documents

-- 1. Create the bucket in storage.buckets if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'Tea-Shop-Images',
    'Tea-Shop-Images',
    true,
    52428800, -- 50 MB
    ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects Security Policies for 'Tea-Shop-Images'

-- Allow public read access to all files in Tea-Shop-Images (for product images, logos, receipts)
DROP POLICY IF EXISTS "Public Access for Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public Access for Tea-Shop-Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'Tea-Shop-Images');

-- Allow authenticated users to upload files to Tea-Shop-Images
DROP POLICY IF EXISTS "Authenticated Upload to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Upload to Tea-Shop-Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Tea-Shop-Images');

-- Allow authenticated users to update their files in Tea-Shop-Images
DROP POLICY IF EXISTS "Authenticated Update in Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Update in Tea-Shop-Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Tea-Shop-Images');

-- Allow authenticated users to delete files from Tea-Shop-Images
DROP POLICY IF EXISTS "Authenticated Delete from Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Delete from Tea-Shop-Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Tea-Shop-Images');

-- Allow anon upload for development/demonstration testing if enabled
DROP POLICY IF EXISTS "Anon Upload to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Anon Upload to Tea-Shop-Images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'Tea-Shop-Images');
