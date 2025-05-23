-- This SQL script fixes all database permissions for the Natural Puff webshop
-- Run this in the Supabase SQL Editor to fix permission issues

-- First, enable RLS on all tables
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous order items" ON public.order_items;

DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view active coupons" ON public.coupons;

-- CRITICAL FIX: Temporarily disable RLS to allow all operations during development
-- Comment these out in production
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;

-- Create new policies for orders table
CREATE POLICY "Everyone can access orders" 
ON public.orders 
FOR ALL 
USING (true);

-- Create new policies for order_items table
CREATE POLICY "Everyone can access order items" 
ON public.order_items 
FOR ALL 
USING (true);

-- Create policies for products table
CREATE POLICY "Everyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');

-- Create policies for coupons table
CREATE POLICY "Admins can manage all coupons" 
ON public.coupons 
FOR ALL 
USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');

CREATE POLICY "Users can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now())
);

-- Grant public access to all tables
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_items TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.coupons TO anon, authenticated;
