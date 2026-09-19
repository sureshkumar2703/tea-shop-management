-- 019_audit_logs.sql
-- Audit logs for security, accounting, and compliance

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'PRODUCT_PRICE_CHANGED', 'ORDER_REFUNDED', 'CASH_DRAWER_CLOSED'
    entity_type VARCHAR(100) NOT NULL, -- 'ORDERS', 'PRODUCTS', 'SALARIES', 'INVENTORY'
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON public.audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
