-- 014_billing.sql
-- Point of Sale Orders, Order Items, and Modifiers

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL, -- e.g. 'ORD-10024'
    cashier_id UUID REFERENCES public.profiles(id),
    customer_name VARCHAR(255) DEFAULT 'Walk-in Guest',
    customer_phone VARCHAR(50),
    order_type VARCHAR(50) DEFAULT 'DINE_IN', -- 'DINE_IN', 'TAKEAWAY', 'DELIVERY'
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_reason VARCHAR(255),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(50) DEFAULT 'PAID', -- 'PAID', 'REFUNDED', 'PENDING'
    status order_status NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES public.addons(id) ON DELETE SET NULL,
    addon_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
