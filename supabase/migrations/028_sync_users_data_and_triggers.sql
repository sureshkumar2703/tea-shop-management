-- ==============================================================================
-- 028_sync_users_data_and_triggers.sql
-- Fixes public.users table columns, trigger metadata extraction, and backfill
-- ==============================================================================

-- 1. Ensure all columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Robust handle_new_auth_user trigger function
-- Wrapped in exception handling so auth.users signups NEVER fail
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_shop_id UUID;
  v_role user_role;
  v_salary NUMERIC;
  v_phone VARCHAR(50);
  v_address TEXT;
  v_password TEXT;
  v_country VARCHAR(100);
  v_state VARCHAR(100);
  v_district VARCHAR(100);
  v_name VARCHAR(255);
BEGIN
  BEGIN
    -- Extract shop_id safely (ensure valid UUID and foreign key)
    IF NEW.raw_user_meta_data ->> 'shop_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'shop_id' <> '' THEN
      BEGIN
        v_shop_id := (NEW.raw_user_meta_data ->> 'shop_id')::uuid;
        -- verify shop exists
        IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = v_shop_id) THEN
          v_shop_id := NULL;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_shop_id := NULL;
      END;
    ELSE
      v_shop_id := NULL;
    END IF;

    -- Extract role safely
    IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL AND NEW.raw_user_meta_data ->> 'role' <> '' THEN
      BEGIN
        v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
      EXCEPTION WHEN OTHERS THEN
        v_role := 'OWNER'::user_role;
      END;
    ELSE
      v_role := 'OWNER'::user_role;
    END IF;

    v_name := COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
    v_phone := NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone), '');
    v_address := NULLIF(NEW.raw_user_meta_data ->> 'address', '');
    v_password := COALESCE(NEW.raw_user_meta_data ->> 'password_hash', NEW.raw_user_meta_data ->> 'password', NEW.encrypted_password);
    v_country := NULLIF(NEW.raw_user_meta_data ->> 'country', '');
    v_state := NULLIF(NEW.raw_user_meta_data ->> 'state', '');
    v_district := NULLIF(NEW.raw_user_meta_data ->> 'district', '');
    v_salary := COALESCE((NEW.raw_user_meta_data ->> 'salary')::numeric, (NEW.raw_user_meta_data ->> 'monthly_salary')::numeric, 0);

    INSERT INTO public.users (
      id,
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
      NEW.id,
      v_shop_id,
      v_name,
      LOWER(NEW.email),
      v_phone,
      v_address,
      v_password,
      v_country,
      v_state,
      v_district,
      v_role,
      v_salary,
      TRUE
    )
    ON CONFLICT (email) DO UPDATE
    SET
      shop_id = COALESCE(EXCLUDED.shop_id, public.users.shop_id),
      name = COALESCE(EXCLUDED.name, public.users.name),
      phone = COALESCE(EXCLUDED.phone, public.users.phone),
      address = COALESCE(EXCLUDED.address, public.users.address),
      password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
      country = COALESCE(EXCLUDED.country, public.users.country),
      state = COALESCE(EXCLUDED.state, public.users.state),
      district = COALESCE(EXCLUDED.district, public.users.district),
      role = COALESCE(EXCLUDED.role, public.users.role),
      salary = COALESCE(EXCLUDED.salary, public.users.salary),
      is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback simple insert if any column error happens
    BEGIN
      INSERT INTO public.users (id, name, email, role, is_active)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        LOWER(NEW.email),
        'OWNER'::user_role,
        TRUE
      )
      ON CONFLICT (email) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Guarantee auth signup succeeds
    END;
  END;

  RETURN NEW;
END;
$$;

-- 3. Re-create trigger on auth.users for BOTH INSERT AND UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created_users ON auth.users;
CREATE TRIGGER on_auth_user_created_users
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Ensure RLS policies allow authenticated and anon to perform full operations on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable select for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated and anon" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated and anon" ON public.users;

CREATE POLICY "Enable select for users"
ON public.users FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert for users"
ON public.users FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Enable update for users"
ON public.users FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for users"
ON public.users FOR DELETE
TO authenticated, anon
USING (true);

-- 5. Backfill any existing users from auth.users metadata
UPDATE public.users u
SET
  shop_id = COALESCE(u.shop_id, NULLIF(au.raw_user_meta_data ->> 'shop_id', '')::uuid),
  name = COALESCE(u.name, au.raw_user_meta_data ->> 'name', au.raw_user_meta_data ->> 'full_name'),
  phone = COALESCE(u.phone, NULLIF(au.raw_user_meta_data ->> 'phone', ''), au.phone),
  address = COALESCE(u.address, NULLIF(au.raw_user_meta_data ->> 'address', '')),
  password_hash = COALESCE(u.password_hash, au.raw_user_meta_data ->> 'password', au.raw_user_meta_data ->> 'password_hash'),
  country = COALESCE(u.country, NULLIF(au.raw_user_meta_data ->> 'country', '')),
  state = COALESCE(u.state, NULLIF(au.raw_user_meta_data ->> 'state', '')),
  district = COALESCE(u.district, NULLIF(au.raw_user_meta_data ->> 'district', ''))
FROM auth.users au
WHERE LOWER(u.email) = LOWER(au.email);
