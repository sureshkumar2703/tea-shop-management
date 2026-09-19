-- 009_recipes.sql
-- Recipes and Bill of Materials for automatic inventory deduction

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL, -- references inventory_items(id), constrained in 010
    quantity_required NUMERIC(10, 3) NOT NULL, -- e.g. 15.000 grams or 0.150 liters
    unit stock_unit NOT NULL DEFAULT 'GRAM',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON public.recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_variant_id ON public.recipes(variant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_shop_id ON public.recipes(shop_id);
