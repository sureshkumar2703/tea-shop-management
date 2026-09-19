-- 015_cash_register.sql
-- Cash drawer sessions and shift cash tally

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
    cash_in NUMERIC(10, 2) DEFAULT 0.00, -- Manual money added
    cash_out NUMERIC(10, 2) DEFAULT 0.00, -- Petty cash payout / cash drop
    status register_status DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_reg_shop_id ON public.cash_registers(shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_reg_cashier ON public.cash_registers(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cash_reg_status ON public.cash_registers(status);
