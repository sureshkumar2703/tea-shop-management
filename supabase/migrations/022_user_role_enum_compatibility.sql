-- Keep an existing user_role enum compatible with the values used by the app.
-- This is safe when the enum already contains any of these values.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';