-- 017_attendance.sql
-- Staff clock-in / clock-out attendance tracking

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

CREATE INDEX IF NOT EXISTS idx_attendance_shop ON public.attendance(shop_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
