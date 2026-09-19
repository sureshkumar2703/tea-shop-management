-- 008_addons.sql
-- Addons and modifiers for beverages and foods

CREATE TABLE IF NOT EXISTS public.addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addons_shop_id ON public.addons(shop_id);
