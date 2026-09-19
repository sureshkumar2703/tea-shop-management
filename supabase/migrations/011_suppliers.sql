-- 011_suppliers.sql
-- Suppliers directory

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'Net 15',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON public.suppliers(shop_id);
