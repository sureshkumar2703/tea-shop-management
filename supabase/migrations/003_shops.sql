-- 003_shops.sql
-- Create multi-tenant shops table

CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'INR',
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    subscription_status shop_status DEFAULT 'TRIAL',
    subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    logo_url TEXT,
    receipt_footer TEXT DEFAULT 'Thank you for visiting! Have a refreshing day with our artisan Chai.',
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{"allow_discounts": true, "enable_qr_menu": true, "enable_sms_receipts": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repair older shops tables before generating slugs.
ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS subscription_status shop_status DEFAULT 'TRIAL';

-- Give existing shops a display name and stable slug before indexing.
UPDATE public.shops
SET name = COALESCE(NULLIF(TRIM(name), ''), 'Tea Shop ' || SUBSTRING(id::text FROM 1 FOR 8))
WHERE name IS NULL OR TRIM(name) = '';

UPDATE public.shops
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_shops_slug ON public.shops (slug);

-- Index for fast lookup by slug and status
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (subscription_status);
