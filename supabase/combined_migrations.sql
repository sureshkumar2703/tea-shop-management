
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';
-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE shop_status AS ENUM ('ACTIVE', 'EXPIRED', 'TRIAL', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'UPI_QR', 'CARD', 'CREDIT', 'SPLIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_unit AS ENUM ('KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'BOX');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE register_status AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. SHOPS
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    shop_code VARCHAR(50) UNIQUE NOT NULL,
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
    start_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_lifetime BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    gpay_qr_url TEXT,
    receipt_footer TEXT DEFAULT 'Thank you for visiting! Have a refreshing day with our artisan Chai.',
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{"allow_discounts": true, "enable_qr_menu": true, "enable_sms_receipts": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    avatar_url TEXT,
    address TEXT,
    country VARCHAR(100) DEFAULT 'India',
    state VARCHAR(100) DEFAULT 'Karnataka',
    district VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    monthly_salary NUMERIC(10, 2) DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Coffee',
    image_url TEXT,
    has_regular_thirsty BOOLEAN DEFAULT FALSE,
    regular_thirsty_types TEXT[] DEFAULT ARRAY['Regular', 'Thirsty'],
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, slug)
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    barcode VARCHAR(100),
    description TEXT,
    unit_mode VARCHAR(20) DEFAULT 'QTY', -- 'QTY' or 'WEIGHT'
    weight_unit VARCHAR(10) DEFAULT 'GM', -- 'GM' or 'KG'
    stock_quantity NUMERIC(10, 2) DEFAULT 100,
    available_weight NUMERIC(10, 2) DEFAULT 0,
    price_mode VARCHAR(20) DEFAULT 'STANDARD', -- 'STANDARD' or 'REGULAR_THIRSTY'
    regular_price NUMERIC(10, 2) DEFAULT 0.00,
    thirsty_price NUMERIC(10, 2) DEFAULT 0.00,
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

-- 7. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    sku VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ADDONS
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

-- 9. INVENTORY ITEMS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    category VARCHAR(100),
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

-- 10. RECIPES
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_required NUMERIC(10, 3) NOT NULL,
    unit stock_unit NOT NULL DEFAULT 'GRAM',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    balance_after NUMERIC(10, 3) NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SUPPLIERS
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

-- 12. PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID',
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

-- 13. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method DEFAULT 'CASH',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. BILLING & ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    cashier_id UUID REFERENCES public.profiles(id),
    customer_name VARCHAR(255) DEFAULT 'Walk-in Guest',
    customer_phone VARCHAR(50),
    order_type VARCHAR(50) DEFAULT 'DINE_IN',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_reason VARCHAR(255),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    cash_amount NUMERIC(10, 2) DEFAULT 0.00,
    gpay_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_split_payment BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) DEFAULT 'PAID',
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
    unit_mode VARCHAR(20) DEFAULT 'QTY',
    weight_grams NUMERIC(10, 2),
    weight_kg NUMERIC(10, 3),
    size_variant VARCHAR(50),
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

-- 15. DATEPAYS (DAILY OWNER INVESTMENT & RECONCILIATION)
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
    status VARCHAR(20) DEFAULT 'OPEN',
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, date)
);

-- 15. CASH REGISTERS
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_float NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    expected_cash NUMERIC(10, 2) DEFAULT 0.00,
    actual_cash NUMERIC(10, 2),
    difference NUMERIC(10, 2) DEFAULT 0.00,
    cash_sales NUMERIC(10, 2) DEFAULT 0.00,
    upi_sales NUMERIC(10, 2) DEFAULT 0.00,
    card_sales NUMERIC(10, 2) DEFAULT 0.00,
    cash_in NUMERIC(10, 2) DEFAULT 0.00,
    cash_out NUMERIC(10, 2) DEFAULT 0.00,
    status register_status DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. SALARY & ADVANCES
CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2020),
    base_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    allowances NUMERIC(10, 2) DEFAULT 0.00,
    bonus NUMERIC(10, 2) DEFAULT 0.00,
    advances_deducted NUMERIC(10, 2) DEFAULT 0.00,
    other_deductions NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_method payment_method DEFAULT 'UPI_QR',
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, employee_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.salary_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(5, 2) DEFAULT 0.00,
    status attendance_status DEFAULT 'PRESENT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, employee_id, attendance_date)
);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. ROW LEVEL SECURITY (RLS)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_user_shop_id()
RETURNS UUID AS $$
    SELECT shop_id FROM public.users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datepays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access shops" ON public.shops FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Shop members view shop" ON public.shops FOR SELECT TO authenticated USING (id = public.get_auth_user_shop_id());
CREATE POLICY "Admin update own shop" ON public.shops FOR UPDATE TO authenticated USING (id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admins manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Users read profiles" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin manage shop profiles" ON public.profiles FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Super admin categories" ON public.categories FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Shop members categories" ON public.categories FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin categories" ON public.categories FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin products" ON public.products FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Shop members products" ON public.products FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin products" ON public.products FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin variants" ON public.product_variants FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Shop members variants" ON public.product_variants FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin variants" ON public.product_variants FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin addons" ON public.addons FOR ALL TO authenticated USING (public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Shop members addons" ON public.addons FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin addons" ON public.addons FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Staff inventory read" ON public.inventory_items FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin inventory write" ON public.inventory_items FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'));

CREATE POLICY "Admin purchases write" ON public.purchases FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'));
CREATE POLICY "Admin purchases read" ON public.purchases FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());

CREATE POLICY "Staff orders" ON public.orders FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Staff order items" ON public.order_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_auth_user_shop_id()));
CREATE POLICY "Staff order addons" ON public.order_item_addons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON oi.order_id = o.id WHERE oi.id = order_item_id AND o.shop_id = public.get_auth_user_shop_id()));

CREATE POLICY "Staff registers" ON public.cash_registers FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Staff attendance" ON public.attendance FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin expenses" ON public.expenses FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'));
CREATE POLICY "Admin salaries" ON public.salaries FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'));
CREATE POLICY "Employee salaries" ON public.salaries FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Staff datepays view" ON public.datepays FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id() OR public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Admin datepays manage" ON public.datepays FOR ALL TO authenticated USING ((shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN')) OR public.get_auth_user_role() = 'ADMIN');
CREATE POLICY "Staff notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Admin audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('OWNER', 'ADMIN'));

-- =====================================================
-- 21. STORAGE BUCKET: Tea-Shop-Images
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'Tea-Shop-Images',
    'Tea-Shop-Images',
    true,
    52428800, -- 50 MB
    ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Access for Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Public Access for Tea-Shop-Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Authenticated Upload to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Upload to Tea-Shop-Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Authenticated Update in Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Update in Tea-Shop-Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Authenticated Delete from Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Authenticated Delete from Tea-Shop-Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Tea-Shop-Images');

DROP POLICY IF EXISTS "Anon Upload to Tea-Shop-Images" ON storage.objects;
CREATE POLICY "Anon Upload to Tea-Shop-Images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'Tea-Shop-Images');

-- =====================================================
-- 23. CREATE USERS ROW WHEN AUTH USER SIGNS UP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (shop_id, name, email, phone, role, salary, is_active)
    VALUES (
        NULLIF(NEW.raw_user_meta_data ->> 'shop_id', '')::uuid,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone), ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'ADMIN'::user_role),
        0,
        TRUE
    )
    ON CONFLICT (email) DO UPDATE
    SET
        name = COALESCE(EXCLUDED.name, public.users.name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        role = COALESCE(EXCLUDED.role, public.users.role),
        shop_id = COALESCE(EXCLUDED.shop_id, public.users.shop_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_users ON auth.users;
CREATE TRIGGER on_auth_user_created_users
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================
-- 24. USERS READ POLICY AND EXISTING AUTH ACCOUNT REPAIR
-- =====================================================

DROP POLICY IF EXISTS "Users read own users row" ON public.users;
CREATE POLICY "Users read own users row"
ON public.users FOR SELECT
TO authenticated
USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

INSERT INTO public.users (shop_id, name, email, phone, role, salary, is_active)
SELECT
    NULL,
    COALESCE(au.raw_user_meta_data ->> 'name', split_part(au.email, '@', 1)),
    au.email,
    NULLIF(au.raw_user_meta_data ->> 'phone', ''),
    'ADMIN'::user_role,
    0,
    TRUE
FROM auth.users AS au
WHERE NOT EXISTS (
    SELECT 1
    FROM public.users AS existing_user
    WHERE LOWER(existing_user.email) = LOWER(au.email)
);

-- =====================================================
-- 25. SHOP LOCATION, STATUS, AND MANAGEMENT POLICIES
-- =====================================================

ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.shops ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins create shops" ON public.shops;
CREATE POLICY "Platform admins create shops"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (public.get_auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Platform admins manage shops" ON public.shops;
CREATE POLICY "Platform admins manage shops"
ON public.shops FOR UPDATE
TO authenticated
USING (public.get_auth_user_role() = 'ADMIN')
WITH CHECK (public.get_auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Platform admins delete shops" ON public.shops;
CREATE POLICY "Platform admins delete shops"
ON public.shops FOR DELETE
TO authenticated
USING (public.get_auth_user_role() = 'ADMIN');
