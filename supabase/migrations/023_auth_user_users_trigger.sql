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
    NULL,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    'ADMIN'::user_role,
    0,
    TRUE
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_users ON auth.users;
CREATE TRIGGER on_auth_user_created_users
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();