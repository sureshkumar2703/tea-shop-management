-- =================================================================
-- MIGRATION: 20260319_tea_shop_enhancements.sql
-- Supports:
-- 1. Shop code (auto-generated alphanumeric), GPay QR image, lifetime subscription
-- 2. Category Regular/Thirsty flags
-- 3. Product Qty vs Gm/Kg units and Regular/Thirsty dynamic pricing
-- 4. User profile addresses (address, country, state, district)
-- 5. Orders split payment (Cash + GPay) and weights
-- 6. Datepay table for owner daily investments and day balancing
-- =================================================================

-- 1. ENHANCE SHOPS TABLE
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS shop_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS gpay_qr_url TEXT,
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Populate shop_code for existing shops if null
UPDATE public.shops
SET shop_code = 'TEA-' || UPPER(SUBSTRING(MD5(id::text || name) FROM 1 FOR 6))
WHERE shop_code IS NULL;

-- 2. ENHANCE CATEGORIES TABLE
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS has_regular_thirsty BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS regular_thirsty_types TEXT[] DEFAULT ARRAY['Regular', 'Thirsty'];

-- 3. ENHANCE PRODUCTS TABLE
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unit_mode VARCHAR(20) DEFAULT 'QTY', -- 'QTY' or 'WEIGHT'
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'GM', -- 'GM' or 'KG'
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10, 2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS available_weight NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_mode VARCHAR(20) DEFAULT 'STANDARD', -- 'STANDARD' or 'REGULAR_THIRSTY'
ADD COLUMN IF NOT EXISTS regular_price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS thirsty_price NUMERIC(10, 2) DEFAULT 0.00;

-- 4. ENHANCE PROFILES TABLE
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Karnataka',
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- 5. ENHANCE ORDERS & ORDER ITEMS
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS gpay_amount NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_split_payment BOOLEAN DEFAULT FALSE;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS unit_mode VARCHAR(20) DEFAULT 'QTY',
ADD COLUMN IF NOT EXISTS weight_grams NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS size_variant VARCHAR(50); -- 'REGULAR', 'THIRSTY', etc.

-- 6. CREATE DATEPAYS TABLE (DAILY OWNER INVESTMENT & RECONCILIATION)
CREATE TABLE IF NOT EXISTS public.datepays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    investment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_billing_cash NUMERIC(10, 2) DEFAULT 0.00,
    total_billing_gpay NUMERIC(10, 2) DEFAULT 0.00,
    total_billing NUMERIC(10, 2) DEFAULT 0.00,
    total_expenses NUMERIC(10, 2) DEFAULT 0.00,
    calculated_balance NUMERIC(10, 2) DEFAULT 0.00,
    actual_closing_cash NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'SETTLED', 'CLOSED'
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, date)
);

-- Enable RLS for datepays
ALTER TABLE public.datepays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop staff view datepays"
ON public.datepays FOR SELECT TO authenticated
USING (shop_id = public.get_auth_user_shop_id() OR public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Admin manage datepays"
ON public.datepays FOR ALL TO authenticated
USING (
    (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'))
    OR public.get_auth_user_role() = 'ADMIN'
);
