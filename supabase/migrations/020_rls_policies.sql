-- 020_rls_policies.sql
-- Complete Row Level Security (RLS) policies for multi-tenant isolation

-- Helper function to fetch the current user's role from public.profiles
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to fetch the current user's shop_id from public.profiles
CREATE OR REPLACE FUNCTION public.get_auth_user_shop_id()
RETURNS UUID AS $$
    SELECT shop_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. SHOPS Policies
CREATE POLICY "Super admins have full access to shops"
ON public.shops FOR ALL
TO authenticated
USING (public.get_auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.get_auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Admins and Employees can view their own shop"
ON public.shops FOR SELECT
TO authenticated
USING (id = public.get_auth_user_shop_id());

CREATE POLICY "Shop owners can update their own shop"
ON public.shops FOR UPDATE
TO authenticated
USING (id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN')
WITH CHECK (id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

-- 2. PROFILES Policies
CREATE POLICY "Super admins manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.get_auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Users can read their own profile or shop members"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR shop_id = public.get_auth_user_shop_id());

CREATE POLICY "Shop admins manage profiles within their shop"
ON public.profiles FOR ALL
TO authenticated
USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. MENU (Categories, Products, Variants, Addons)
CREATE POLICY "Super admin full access to categories" ON public.categories FOR ALL TO authenticated USING (public.get_auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Shop members read categories" ON public.categories FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Shop admin manage categories" ON public.categories FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin full access to products" ON public.products FOR ALL TO authenticated USING (public.get_auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Shop members read products" ON public.products FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Shop admin manage products" ON public.products FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin full access to variants" ON public.product_variants FOR ALL TO authenticated USING (public.get_auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Shop members read variants" ON public.product_variants FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Shop admin manage variants" ON public.product_variants FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

CREATE POLICY "Super admin full access to addons" ON public.addons FOR ALL TO authenticated USING (public.get_auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Shop members read addons" ON public.addons FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Shop admin manage addons" ON public.addons FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() = 'ADMIN');

-- 4. INVENTORY & PURCHASES
CREATE POLICY "Shop admin manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
CREATE POLICY "Staff read inventory" ON public.inventory_items FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id());

CREATE POLICY "Shop admin manage purchases" ON public.purchases FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
CREATE POLICY "Shop admin manage purchase items" ON public.purchase_items FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN')));

-- 5. ORDERS & BILLING
CREATE POLICY "Staff manage orders in their shop" ON public.orders FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_auth_user_shop_id()));
CREATE POLICY "Staff manage order addons" ON public.order_item_addons FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON oi.order_id = o.id WHERE oi.id = order_item_id AND o.shop_id = public.get_auth_user_shop_id()));

-- 6. CASH REGISTER & ATTENDANCE
CREATE POLICY "Staff manage their register sessions" ON public.cash_registers FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Staff view and check attendance" ON public.attendance FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id());

-- 7. EXPENSES & SALARIES
CREATE POLICY "Shop admin manage expenses" ON public.expenses FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
CREATE POLICY "Shop admin manage salaries" ON public.salaries FOR ALL TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
CREATE POLICY "Employees view own salary" ON public.salaries FOR SELECT TO authenticated USING (employee_id = auth.uid());

-- 8. NOTIFICATIONS & AUDIT LOGS
CREATE POLICY "User see own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR shop_id = public.get_auth_user_shop_id());
CREATE POLICY "Shop admin read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (shop_id = public.get_auth_user_shop_id() AND public.get_auth_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
