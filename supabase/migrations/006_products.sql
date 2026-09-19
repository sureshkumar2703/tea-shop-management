-- 006_products.sql
-- Products / Menu items table

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    barcode VARCHAR(100),
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    preparation_time_minutes INT DEFAULT 3,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    calories INT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
