-- 013_expenses.sql
-- Operating expenses & petty cash handover tracking

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Rent', 'Electricity', 'Gas / LPG', 'Water', 'Maintenance', 'Cleaning', 'Marketing', 'Packaging', 'Misc'
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Initial cash given / budget
    bill_amount NUMERIC(10, 2) DEFAULT 0.00, -- Actual bill spent
    balance_amount NUMERIC(10, 2) DEFAULT 0.00, -- Dynamically calculated: (amount - bill_amount)
    payment_method VARCHAR(50) DEFAULT 'CASH',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED'
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrade script if table already exists in existing Supabase instances:
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS bill_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

