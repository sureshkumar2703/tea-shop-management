-- 016_salary.sql
-- Staff compensation, monthly payroll, advances and payouts

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
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'PARTIAL'
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

CREATE INDEX IF NOT EXISTS idx_salaries_shop ON public.salaries(shop_id);
CREATE INDEX IF NOT EXISTS idx_salaries_employee ON public.salaries(employee_id);
