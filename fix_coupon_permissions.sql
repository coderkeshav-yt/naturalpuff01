-- Enable Row Level Security on the coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view coupons" ON "public"."coupons";
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON "public"."coupons";
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON "public"."coupons";
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON "public"."coupons";

-- Create policy for SELECT operations
CREATE POLICY "Authenticated users can view coupons"
  ON "public"."coupons"
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for INSERT operations
CREATE POLICY "Authenticated users can insert coupons"
  ON "public"."coupons"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy for UPDATE operations
CREATE POLICY "Authenticated users can update coupons"
  ON "public"."coupons"
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policy for DELETE operations
CREATE POLICY "Authenticated users can delete coupons"
  ON "public"."coupons"
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Grant all privileges on the coupons table to authenticated users
GRANT ALL ON "public"."coupons" TO authenticated;
GRANT ALL ON "public"."coupons" TO service_role;
GRANT ALL ON "public"."coupons" TO anon;

-- Reset the sequence if needed
ALTER SEQUENCE IF EXISTS public.coupons_id_seq RESTART WITH 1;

-- Notify of completion
SELECT 'Coupon permissions have been successfully configured.' AS result;
