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

-- Index for fast lookup by slug and status
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (subscription_status);
