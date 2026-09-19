-- 012_purchases.sql
-- Stock purchases and supplier purchase orders

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID', -- 'PAID', 'PARTIAL', 'PENDING'
    payment_method payment_method DEFAULT 'UPI_QR',
    notes TEXT,
    received_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 3) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_shop_id ON public.purchases(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
