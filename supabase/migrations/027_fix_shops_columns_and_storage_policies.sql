-- ==============================================================================
-- 027_fix_shops_columns_and_storage_policies.sql
-- Fixes shops table columns, RLS policies, and Supabase Storage bucket upload
-- ==============================================================================

-- 1. Ensure all columns (and aliases) exist on public.shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS shop_code VARCHAR(50);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS shop_image TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS gpay_qr_url TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS gpay_qr_image TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 5.00;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"allow_discounts": true, "enable_qr_menu": true, "enable_sms_receipts": false}'::jsonb;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Sync name <-> shop_name, logo_url <-> shop_image, gpay_qr_url <-> gpay_qr_image automatically
CREATE OR REPLACE FUNCTION public.sync_shop_column_aliases()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.name IS NULL AND NEW.shop_name IS NOT NULL THEN
    NEW.name := NEW.shop_name;
  ELSIF NEW.shop_name IS NULL AND NEW.name IS NOT NULL THEN
    NEW.shop_name := NEW.name;
  END IF;

  IF NEW.logo_url IS NULL AND NEW.shop_image IS NOT NULL THEN
    NEW.logo_url := NEW.shop_image;
  ELSIF NEW.shop_image IS NULL AND NEW.logo_url IS NOT NULL THEN
    NEW.shop_image := NEW.logo_url;
  END IF;

  IF NEW.gpay_qr_url IS NULL AND NEW.gpay_qr_image IS NOT NULL THEN
    NEW.gpay_qr_url := NEW.gpay_qr_image;
  ELSIF NEW.gpay_qr_image IS NULL AND NEW.gpay_qr_url IS NOT NULL THEN
    NEW.gpay_qr_image := NEW.gpay_qr_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_shop_column_aliases ON public.shops;
CREATE TRIGGER trg_sync_shop_column_aliases
  BEFORE INSERT OR UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.sync_shop_column_aliases();

-- 3. Configure public.shops RLS policies for seamless CRUD
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable select shops" ON public.shops;
DROP POLICY IF EXISTS "Enable insert shops" ON public.shops;
DROP POLICY IF EXISTS "Enable update shops" ON public.shops;
DROP POLICY IF EXISTS "Enable delete shops" ON public.shops;
DROP POLICY IF EXISTS "Platform admins create shops" ON public.shops;
DROP POLICY IF EXISTS "Platform admins manage shops" ON public.shops;
DROP POLICY IF EXISTS "Platform admins delete shops" ON public.shops;

CREATE POLICY "Enable select shops"
ON public.shops FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert shops"
ON public.shops FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Enable update shops"
ON public.shops FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete shops"
ON public.shops FOR DELETE
TO authenticated, anon
USING (true);

-- 4. Create and configure Supabase Storage bucket 'Tea-Shop-Images'
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

-- 5. Storage Security Policies for 'Tea-Shop-Images'
DROP POLICY IF EXISTS "Public and Auth Select to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public and Auth Select to Tea-Shop-Images"
ON storage.objects FOR SELECT
TO public, authenticated, anon
USING (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Public and Auth Upload to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public and Auth Upload to Tea-Shop-Images"
ON storage.objects FOR INSERT
TO public, authenticated, anon
WITH CHECK (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Public and Auth Update to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public and Auth Update to Tea-Shop-Images"
ON storage.objects FOR UPDATE
TO public, authenticated, anon
USING (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Public and Auth Delete to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public and Auth Delete to Tea-Shop-Images"
ON storage.objects FOR DELETE
TO public, authenticated, anon
USING (bucket_id = 'Tea-Shop-Images');
