-- Add the fields used by the Create Shop form to the existing shops table.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.shop_status AS ENUM ('ACTIVE', 'EXPIRED', 'TRIAL', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  shop_code VARCHAR(50) UNIQUE NOT NULL,
  tagline VARCHAR(255),
  logo_url TEXT,
  gpay_qr_url TEXT,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status shop_status NOT NULL DEFAULT 'ACTIVE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  gst_number VARCHAR(50),
  settings JSONB NOT NULL DEFAULT '{"allow_discounts": true, "enable_qr_menu": true, "enable_sms_receipts": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT shops_lifetime_or_expiry_check CHECK (is_lifetime = TRUE OR expiry_date IS NOT NULL)
);

-- This migration can be run by itself in the Supabase SQL editor.
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  LIMIT 1;
$$;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- New shops are active by default; preserve existing inactive rows.
ALTER TABLE public.shops ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins create shops" ON public.shops;
CREATE POLICY "Platform admins create shops"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (public.get_auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Platform admins manage shops" ON public.shops;
CREATE POLICY "Platform admins manage shops"
ON public.shops FOR UPDATE
TO authenticated
USING (public.get_auth_user_role() = 'ADMIN')
WITH CHECK (public.get_auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Platform admins delete shops" ON public.shops;
CREATE POLICY "Platform admins delete shops"
ON public.shops FOR DELETE
TO authenticated
USING (public.get_auth_user_role() = 'ADMIN');