-- 013_expenses.sql
-- Operating expenses tracking

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Rent', 'Electricity', 'Gas / LPG', 'Water', 'Maintenance', 'Cleaning', 'Marketing', 'Packaging', 'Misc'
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method DEFAULT 'CASH',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
