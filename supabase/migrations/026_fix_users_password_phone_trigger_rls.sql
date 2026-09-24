-- ==============================================================================
-- 026_fix_users_password_phone_trigger_rls.sql
-- Fixes password_hash, phone, address, and shop_id saving in public.users
-- ==============================================================================

-- 1. Ensure required columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Enhanced handle_new_auth_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    shop_id,
    name,
    email,
    phone,
    address,
    password_hash,
    country,
    state,
    district,
    role,
    salary,
    is_active
  )
  VALUES (
    NULLIF(NEW.raw_user_meta_data ->> 'shop_id', '')::uuid,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    LOWER(NEW.email),
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone), ''),
    NULLIF(NEW.raw_user_meta_data ->> 'address', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'password_hash', NEW.raw_user_meta_data ->> 'password', NEW.encrypted_password),
    NULLIF(NEW.raw_user_meta_data ->> 'country', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'state', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'district', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'ADMIN'::user_role),
    COALESCE((NEW.raw_user_meta_data ->> 'salary')::numeric, 0),
    TRUE
  )
  ON CONFLICT (email) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    address = COALESCE(EXCLUDED.address, public.users.address),
    password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
    country = COALESCE(EXCLUDED.country, public.users.country),
    state = COALESCE(EXCLUDED.state, public.users.state),
    district = COALESCE(EXCLUDED.district, public.users.district),
    role = COALESCE(EXCLUDED.role, public.users.role),
    salary = COALESCE(EXCLUDED.salary, public.users.salary),
    shop_id = COALESCE(EXCLUDED.shop_id, public.users.shop_id);

  RETURN NEW;
END;
$$;

-- 3. Re-create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_users ON auth.users;
CREATE TRIGGER on_auth_user_created_users
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Enable RLS and add full CRUD policies for public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own users row" ON public.users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated and anon" ON public.users;
DROP POLICY IF EXISTS "Enable select for users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;

CREATE POLICY "Enable select for users"
ON public.users FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert for authenticated and anon"
ON public.users FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Enable update for users"
ON public.users FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 5. Backfill existing users table rows from auth.users metadata
UPDATE public.users u
SET
  phone = COALESCE(u.phone, NULLIF(au.raw_user_meta_data ->> 'phone', ''), au.phone),
  address = COALESCE(u.address, NULLIF(au.raw_user_meta_data ->> 'address', '')),
  password_hash = COALESCE(u.password_hash, au.raw_user_meta_data ->> 'password', au.raw_user_meta_data ->> 'password_hash', au.encrypted_password),
  shop_id = COALESCE(u.shop_id, NULLIF(au.raw_user_meta_data ->> 'shop_id', '')::uuid)
FROM auth.users au
WHERE LOWER(u.email) = LOWER(au.email);
