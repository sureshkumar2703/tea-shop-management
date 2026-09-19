-- =================================================================
-- PRODUCTION SQL QUERIES FOR TEA SHOP MANAGEMENT SYSTEM
-- Multi-Tenant SaaS with Superadmin, Admin (Owner), and Employee Roles
-- =================================================================

-- -----------------------------------------------------------------
-- 1. SUPERADMIN QUERIES
-- -----------------------------------------------------------------

-- 1.1 Superadmin Dashboard KPIs
SELECT 
    (SELECT COUNT(*) FROM public.shops WHERE is_active = TRUE) AS active_shops_count,
    (SELECT COUNT(*) FROM public.shops WHERE subscription_status = 'ACTIVE') AS active_subscriptions_count,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'ADMIN') AS total_admins_count,
    (SELECT COALESCE(SUM(total_amount), 0.00) FROM public.orders WHERE status = 'COMPLETED') AS total_platform_revenue;

-- 1.2 Create New Shop (with auto-generated shop_code & GPay QR)
-- Example: shop_code 'TEA-9X8K2', is_lifetime toggle
INSERT INTO public.shops (
    id, name, slug, shop_code, address, phone, email, 
    gpay_qr_url, is_lifetime, start_date, expiry_date, tax_rate, subscription_status
)
VALUES (
    gen_random_uuid(),
    'Chai Craft Koramangala',
    'chai-craft-koramangala',
    'TEA-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)),
    '#102, 80 Feet Road, 4th Block, Koramangala, Bangalore',
    '+91 98765 11223',
    'koramangala@chaicraft.in',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a', -- sample QR
    FALSE,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '365 days',
    5.00,
    'ACTIVE'
)
RETURNING *;

-- 1.3 Create Shop Admin / Owner (Linked to the newly created shop)
-- Automatically takes shop_code, records location (address, country, state, district)
INSERT INTO public.profiles (
    id, shop_id, full_name, email, phone, role, 
    address, country, state, district, is_active
)
VALUES (
    gen_random_uuid(), -- or auth.uid() from auth.users
    'a1111111-1111-1111-1111-111111111111', -- target shop_id
    'Aditya Narayanan',
    'aditya@chaicraft.in',
    '+91 98450 12345',
    'ADMIN',
    'No. 45, 2nd Cross, Indiranagar',
    'India',
    'Karnataka',
    'Bangalore Urban',
    TRUE
)
RETURNING *;

-- 1.4 Shop-Based Report (Superadmin Report across shops)
SELECT 
    s.id AS shop_id,
    s.name AS shop_name,
    s.shop_code,
    s.phone,
    s.subscription_status,
    s.is_lifetime,
    s.subscription_end_date,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0.00) AS total_revenue,
    COALESCE(SUM(CASE WHEN o.payment_method = 'CASH' THEN o.total_amount WHEN o.payment_method = 'SPLIT' THEN o.cash_amount ELSE 0 END), 0.00) AS total_cash_revenue,
    COALESCE(SUM(CASE WHEN o.payment_method = 'UPI_QR' THEN o.total_amount WHEN o.payment_method = 'SPLIT' THEN o.gpay_amount ELSE 0 END), 0.00) AS total_gpay_revenue,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'EMPLOYEE') AS total_employees
FROM public.shops s
LEFT JOIN public.orders o ON s.id = o.shop_id AND o.status = 'COMPLETED'
LEFT JOIN public.profiles p ON s.id = p.shop_id AND p.is_active = TRUE
GROUP BY s.id, s.name, s.shop_code, s.phone, s.subscription_status, s.is_lifetime, s.subscription_end_date
ORDER BY total_revenue DESC;


-- -----------------------------------------------------------------
-- 2. ADMIN (OWNER) QUERIES
-- -----------------------------------------------------------------

-- 2.1 Add Category with Regular & Thirsty Flag
INSERT INTO public.categories (
    id, shop_id, name, slug, description, has_regular_thirsty, regular_thirsty_types, is_active
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'Special Kulhad Chai',
    'special-kulhad-chai',
    'Fresh milk tea in baked earthen cups with Regular & Thirsty sizes',
    TRUE,
    ARRAY['Regular', 'Thirsty'],
    TRUE
)
RETURNING *;

-- 2.2 Add Product:
-- 2.2.A Product with Regular & Thirsty Prices (e.g. Masala Chai)
INSERT INTO public.products (
    id, shop_id, category_id, name, sku, unit_mode, price_mode, 
    regular_price, thirsty_price, base_price, stock_quantity, is_available
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Royal Saffron Cardamom Chai',
    'TEA-SAF-01',
    'QTY',
    'REGULAR_THIRSTY',
    30.00,  -- Regular Price
    50.00,  -- Thirsty Price
    30.00,  -- Base Price
    150,    -- Stock Qty in cups
    TRUE
)
RETURNING *;

-- 2.2.B Product with Weight (Gm or Kg) wise (e.g. CTC Assam Tea Leaves)
INSERT INTO public.products (
    id, shop_id, category_id, name, sku, unit_mode, weight_unit, 
    available_weight, price_mode, base_price, is_available
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Assam CTC First Flush Leaf Pack',
    'RAW-CTC-KG',
    'WEIGHT',
    'GM',
    5000.00, -- 5000 grams in stock
    'STANDARD',
    0.80,    -- ₹0.80 per gram (= ₹800/kg)
    TRUE
)
RETURNING *;

-- 2.3 Create Co-Admin / Store Manager under this Shop
INSERT INTO public.profiles (
    id, shop_id, full_name, email, phone, role, 
    address, country, state, district, is_active
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'Rohan Verma',
    'rohan.manager@chaicraft.in',
    '+91 97654 32109',
    'ADMIN',
    '12, MG Road, Residency Area',
    'India',
    'Karnataka',
    'Bangalore Urban',
    TRUE
);

-- 2.4 Create Employee / Barista under this Shop
INSERT INTO public.profiles (
    id, shop_id, full_name, email, phone, role, 
    address, country, state, district, monthly_salary, is_active
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'Suresh Kumar',
    'suresh@chaicraft.in',
    '+91 98111 22233',
    'EMPLOYEE',
    'House #14, BTM Layout',
    'India',
    'Karnataka',
    'Bangalore Urban',
    22000.00,
    TRUE
);

-- 2.5 Billing POS (Insert Order with Split Payment / Cash / GPay)
-- 2.5.A Cash Order
INSERT INTO public.orders (
    id, shop_id, order_number, cashier_id, customer_name, subtotal, tax_amount, total_amount, 
    payment_method, cash_amount, gpay_amount, status
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'ORD-20260319-001',
    'e1111111-1111-1111-1111-111111111111',
    'Walk-in Guest',
    100.00, 5.00, 105.00,
    'CASH', 105.00, 0.00,
    'COMPLETED'
);

-- 2.5.B Both (Cash & GPay Split) Order
INSERT INTO public.orders (
    id, shop_id, order_number, cashier_id, customer_name, subtotal, tax_amount, total_amount, 
    payment_method, cash_amount, gpay_amount, is_split_payment, status
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'ORD-20260319-002',
    'e1111111-1111-1111-1111-111111111111',
    'Pooja Hegde',
    200.00, 10.00, 210.00,
    'SPLIT', 105.00, 105.00, TRUE,
    'COMPLETED'
);

-- 2.6 Record Daily Expense
INSERT INTO public.expenses (
    id, shop_id, title, category, amount, payment_method, expense_date, notes
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'Fresh Cow Milk (25 Liters)',
    'Raw Ingredients',
    1600.00,
    'CASH',
    CURRENT_DATE,
    'Daily morning dairy delivery from Nandini Milk'
);

-- 2.7 DATEPAY: Daily Owner Investment & Reconciliation Calculation
-- Formula: Calculated Balance = Investment Amount + Total Billing - Total Expenses
INSERT INTO public.datepays (
    id, shop_id, date, investment_amount,
    total_billing_cash, total_billing_gpay, total_billing,
    total_expenses, calculated_balance, status, notes
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    CURRENT_DATE,
    2500.00, -- Owner morning investment / starting cash float
    (SELECT COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_amount WHEN payment_method = 'SPLIT' THEN cash_amount ELSE 0 END), 0) FROM public.orders WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(CASE WHEN payment_method = 'UPI_QR' THEN total_amount WHEN payment_method = 'SPLIT' THEN gpay_amount ELSE 0 END), 0) FROM public.orders WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND expense_date = CURRENT_DATE),
    -- Calculated Balance = Investment + Billing - Expenses
    2500.00 
      + (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND DATE(created_at) = CURRENT_DATE) 
      - (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND expense_date = CURRENT_DATE),
    'OPEN',
    'Morning opening float for milk and spice purchases'
)
ON CONFLICT (shop_id, date) DO UPDATE SET
    investment_amount = EXCLUDED.investment_amount,
    total_billing_cash = EXCLUDED.total_billing_cash,
    total_billing_gpay = EXCLUDED.total_billing_gpay,
    total_billing = EXCLUDED.total_billing,
    total_expenses = EXCLUDED.total_expenses,
    calculated_balance = EXCLUDED.calculated_balance,
    updated_at = NOW();

-- 2.8 INDIVIDUAL REPORTS (Day, Week, Month, Year, Selected Month, Selected Year, Overall)

-- 2.8.A DAY REPORT (Today or Specific Date)
SELECT 
    DATE(o.created_at) AS report_date,
    COUNT(o.id) AS total_bills,
    COALESCE(SUM(o.total_amount), 0.00) AS total_billing,
    COALESCE(SUM(CASE WHEN o.payment_method = 'CASH' THEN o.total_amount WHEN o.payment_method = 'SPLIT' THEN o.cash_amount ELSE 0 END), 0.00) AS cash_billing,
    COALESCE(SUM(CASE WHEN o.payment_method = 'UPI_QR' THEN o.total_amount WHEN o.payment_method = 'SPLIT' THEN o.gpay_amount ELSE 0 END), 0.00) AS gpay_billing,
    (SELECT COALESCE(SUM(amount), 0.00) FROM public.expenses WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND expense_date = DATE(o.created_at)) AS total_expenses,
    (SELECT investment_amount FROM public.datepays WHERE shop_id = 'a1111111-1111-1111-1111-111111111111' AND date = DATE(o.created_at)) AS day_investment
FROM public.orders o
WHERE o.shop_id = 'a1111111-1111-1111-1111-111111111111' 
  AND DATE(o.created_at) = CURRENT_DATE
  AND o.status = 'COMPLETED'
GROUP BY DATE(o.created_at);

-- 2.8.B WEEK REPORT (Current Rolling 7 Days)
SELECT 
    DATE_TRUNC('week', created_at)::DATE AS week_start,
    COUNT(id) AS total_bills,
    SUM(total_amount) AS total_billing,
    SUM(CASE WHEN payment_method = 'CASH' THEN total_amount WHEN payment_method = 'SPLIT' THEN cash_amount ELSE 0 END) AS cash_billing,
    SUM(CASE WHEN payment_method = 'UPI_QR' THEN total_amount WHEN payment_method = 'SPLIT' THEN gpay_amount ELSE 0 END) AS gpay_billing
FROM public.orders
WHERE shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND created_at >= NOW() - INTERVAL '7 days'
  AND status = 'COMPLETED'
GROUP BY DATE_TRUNC('week', created_at);

-- 2.8.C MONTH REPORT (Current Month)
SELECT 
    DATE(created_at) AS day_date,
    COUNT(id) AS daily_bills,
    SUM(total_amount) AS daily_sales
FROM public.orders
WHERE shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY day_date ASC;

-- 2.8.D YEAR REPORT (Current Year Month-by-Month)
SELECT 
    TO_CHAR(created_at, 'Month') AS month_name,
    EXTRACT(MONTH FROM created_at) AS month_number,
    COUNT(id) AS total_bills,
    SUM(total_amount) AS total_sales
FROM public.orders
WHERE shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND status = 'COMPLETED'
GROUP BY TO_CHAR(created_at, 'Month'), EXTRACT(MONTH FROM created_at)
ORDER BY month_number ASC;

-- 2.8.E SELECTED MONTH REPORT (e.g. Month = 3, Year = 2026)
SELECT 
    DATE(o.created_at) AS order_date,
    COUNT(o.id) AS bills_count,
    SUM(o.total_amount) AS sales_amount
FROM public.orders o
WHERE o.shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND EXTRACT(MONTH FROM o.created_at) = 3
  AND EXTRACT(YEAR FROM o.created_at) = 2026
  AND o.status = 'COMPLETED'
GROUP BY DATE(o.created_at)
ORDER BY order_date ASC;

-- 2.8.F SELECTED YEAR REPORT (e.g. Year = 2026)
SELECT 
    TO_CHAR(o.created_at, 'Mon YYYY') AS period,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_sales
FROM public.orders o
WHERE o.shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND EXTRACT(YEAR FROM o.created_at) = 2026
  AND o.status = 'COMPLETED'
GROUP BY TO_CHAR(o.created_at, 'Mon YYYY'), EXTRACT(MONTH FROM o.created_at)
ORDER BY EXTRACT(MONTH FROM o.created_at) ASC;

-- 2.8.G OVERALL REPORT (All-Time Lifetime Overview)
SELECT 
    COUNT(o.id) AS lifetime_bills,
    COALESCE(SUM(o.total_amount), 0.00) AS lifetime_billing,
    (SELECT COALESCE(SUM(amount), 0.00) FROM public.expenses WHERE shop_id = 'a1111111-1111-1111-1111-111111111111') AS lifetime_expenses,
    (SELECT COALESCE(SUM(investment_amount), 0.00) FROM public.datepays WHERE shop_id = 'a1111111-1111-1111-1111-111111111111') AS lifetime_investment,
    COALESCE(SUM(o.total_amount), 0.00) - (SELECT COALESCE(SUM(amount), 0.00) FROM public.expenses WHERE shop_id = 'a1111111-1111-1111-1111-111111111111') AS lifetime_net_profit
FROM public.orders o
WHERE o.shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND o.status = 'COMPLETED';

-- 2.9 SALARY PAGE & SALARY REPORT QUERIES
-- Record / Disburse Employee Salary
INSERT INTO public.salaries (
    id, shop_id, employee_id, month, year, 
    base_salary, allowances, bonus, advances_deducted, 
    net_payable, paid_amount, payment_status, payment_method, payment_date, notes
)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    3, 2026,
    22000.00, 1500.00, 500.00, 1000.00,
    23000.00, 23000.00, 'PAID', 'UPI_QR', CURRENT_DATE,
    'March 2026 salary disbursed via GPay'
)
ON CONFLICT (shop_id, employee_id, month, year) DO UPDATE SET
    net_payable = EXCLUDED.net_payable,
    paid_amount = EXCLUDED.paid_amount,
    payment_status = EXCLUDED.payment_status,
    payment_date = EXCLUDED.payment_date;

-- Salary Report Query
SELECT 
    sal.id,
    p.full_name AS employee_name,
    p.email,
    p.phone,
    sal.month,
    sal.year,
    sal.base_salary,
    sal.allowances,
    sal.bonus,
    sal.advances_deducted,
    sal.net_payable,
    sal.paid_amount,
    sal.payment_status,
    sal.payment_method,
    sal.payment_date,
    sal.notes
FROM public.salaries sal
JOIN public.profiles p ON sal.employee_id = p.id
WHERE sal.shop_id = 'a1111111-1111-1111-1111-111111111111'
ORDER BY sal.year DESC, sal.month DESC;


-- -----------------------------------------------------------------
-- 3. EMPLOYEE QUERIES
-- -----------------------------------------------------------------

-- 3.1 Employee Dashboard Summary
SELECT 
    COUNT(o.id) AS today_punched_bills,
    COALESCE(SUM(o.total_amount), 0.00) AS today_sales_amount
FROM public.orders o
WHERE o.shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND o.cashier_id = 'e1111111-1111-1111-1111-111111111111'
  AND DATE(o.created_at) = CURRENT_DATE
  AND o.status = 'COMPLETED';

-- 3.2 Employee Report (Bills & Expenses)
-- Day Bills
SELECT order_number, total_amount, payment_method, created_at
FROM public.orders
WHERE cashier_id = 'e1111111-1111-1111-1111-111111111111'
  AND DATE(created_at) = CURRENT_DATE;

-- Shift Expenses
SELECT title, category, amount, payment_method, expense_date
FROM public.expenses
WHERE shop_id = 'a1111111-1111-1111-1111-111111111111'
  AND expense_date = CURRENT_DATE;

-- 3.3 Employee Personal Salary Report
SELECT 
    month, year, base_salary, allowances, bonus, advances_deducted, 
    net_payable, paid_amount, payment_status, payment_date, payment_method
FROM public.salaries
WHERE employee_id = 'e1111111-1111-1111-1111-111111111111'
ORDER BY year DESC, month DESC;
