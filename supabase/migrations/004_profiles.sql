-- 004_profiles.sql
-- Create user profiles linked to auth.users and shops

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    monthly_salary NUMERIC(10, 2) DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_shop_id ON public.profiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
