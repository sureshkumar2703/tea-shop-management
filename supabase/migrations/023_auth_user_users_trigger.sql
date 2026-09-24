-- Create the application users row from Auth signup.
-- SECURITY DEFINER avoids exposing a broad users INSERT policy to the browser.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (shop_id, name, email, phone, role, salary, is_active)
  VALUES (
    NULLIF(NEW.raw_user_meta_data ->> 'shop_id', '')::uuid,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone), ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'ADMIN'::user_role),
    0,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    role = COALESCE(EXCLUDED.role, public.users.role),
    shop_id = COALESCE(EXCLUDED.shop_id, public.users.shop_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_users ON auth.users;
CREATE TRIGGER on_auth_user_created_users
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();