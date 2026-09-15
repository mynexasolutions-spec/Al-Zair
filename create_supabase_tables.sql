-- ==========================================================
-- ALZAIR DATABASE SCHEMA SETUP FOR SUPABASE
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oadpkwwcwndocanqnltd/sql/new
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CUSTOMERS / USERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    postal_code TEXT DEFAULT '',
    state TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Insert / Update sample customer
INSERT INTO public.customers (id, full_name, email, password, phone, address, city, postal_code, state)
VALUES 
  ('cust_sample_1', 'Priya Sharma', 'customer@alzair.com', 'alzair123', '+91 9876543210', 'Flat 402, Royal Palms', 'Mumbai', '400001', 'Maharashtra')
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, address = EXCLUDED.address;

-- 2. CREATE / UPDATE ORDERS TABLE & ADD MISSING COLUMNS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    shipping_address TEXT NOT NULL,
    city TEXT DEFAULT '',
    postal_code TEXT DEFAULT '',
    state TEXT DEFAULT '',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    order_status TEXT NOT NULL DEFAULT 'processing',
    payment_method TEXT DEFAULT 'cod',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 3. PRODUCTS TABLE & COUPON CODE COLUMNS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_discount TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Ensure Safawi Dates Premium has a sample coupon
UPDATE public.products 
SET coupon_code = 'SAFAWI15', coupon_discount = '15% OFF'
WHERE id = 'safawi-dates-premium' OR id = 'safawi-dates';

-- ==========================================================
-- 4. COUPONS TABLE FOR ADMIN MANAGEMENT
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount NUMERIC(10, 2),
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on coupons" ON public.coupons;
CREATE POLICY "Allow all on coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- Insert sample & active promo coupons
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, is_active, description)
VALUES 
  ('coup_safawi15', 'SAFAWI15', 'percentage', 15, 0, true, 'Safawi Dates 15% discount on all orders'),
  ('coup_ramadan20', 'RAMADAN20', 'percentage', 20, 0, true, 'Ramadan festive 20% discount'),
  ('coup_alzair10', 'ALZAIR10', 'percentage', 10, 0, true, 'Standard 10% storewide discount'),
  ('coup_first50', 'FIRST50', 'flat', 50, 499, true, 'Flat ₹50 OFF on orders above ₹499'),
  ('coup_kalmi15', 'KALMI15', 'percentage', 15, 0, true, 'Kalmi Dates Delight special 15% discount'),
  ('coup_cashew15', 'CASHEW15', 'percentage', 15, 0, true, 'Cashew Stuffed Dates special 15% discount')
ON CONFLICT (code) DO NOTHING;



