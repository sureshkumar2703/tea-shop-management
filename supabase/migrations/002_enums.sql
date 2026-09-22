-- 002_enums.sql
-- Create custom ENUM types for Tea Shop Management

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shop_status AS ENUM ('ACTIVE', 'EXPIRED', 'TRIAL', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'UPI_QR', 'CARD', 'CREDIT', 'SPLIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_unit AS ENUM ('KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'BOX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE register_status AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
