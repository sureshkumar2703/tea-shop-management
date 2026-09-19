-- 010_inventory.sql
-- Raw materials and inventory tracking table

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    category VARCHAR(100), -- 'Dairy', 'Tea Leaves', 'Spices', 'Sweeteners', 'Packaging', 'Snack Ingredients'
    unit stock_unit NOT NULL DEFAULT 'KG',
    current_stock NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    min_alert_threshold NUMERIC(10, 3) NOT NULL DEFAULT 5.000,
    ideal_stock NUMERIC(10, 3) DEFAULT 25.000,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    supplier_name VARCHAR(255),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_shop_id ON public.inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert ON public.inventory_items(current_stock, min_alert_threshold);

-- Add constraint to recipes table
DO $$ BEGIN
    ALTER TABLE public.recipes 
    ADD CONSTRAINT fk_recipes_inventory 
    FOREIGN KEY (raw_material_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory transaction logs (restock, consumption, wastage, adjustment)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'SALE_CONSUMPTION', 'WASTAGE', 'MANUAL_ADJUSTMENT'
    quantity NUMERIC(10, 3) NOT NULL,
    balance_after NUMERIC(10, 3) NOT NULL,
    reference_id UUID, -- order_id or purchase_id
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_item_id ON public.inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_shop_id ON public.inventory_transactions(shop_id);
