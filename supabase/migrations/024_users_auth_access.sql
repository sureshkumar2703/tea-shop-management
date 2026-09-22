-- Allow a signed-in user to read only their own application row.
DROP POLICY IF EXISTS "Users read own users row" ON public.users;
CREATE POLICY "Users read own users row"
ON public.users FOR SELECT
TO authenticated
USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Repair Auth accounts created before the signup trigger was installed.
INSERT INTO public.users (shop_id, name, email, phone, role, salary, is_active)
SELECT
  NULL,
  COALESCE(au.raw_user_meta_data ->> 'name', split_part(au.email, '@', 1)),
  au.email,
  NULLIF(au.raw_user_meta_data ->> 'phone', ''),
  'ADMIN'::user_role,
  0,
  TRUE
FROM auth.users AS au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users AS existing_user
  WHERE LOWER(existing_user.email) = LOWER(au.email)
);