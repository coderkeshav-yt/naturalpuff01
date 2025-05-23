-- Create a function with security definer (runs with the privileges of the creator)
CREATE OR REPLACE FUNCTION public.fix_coupon_permissions_with_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enable RLS on the coupons table
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
    USING (true);  -- Allow everyone to view coupons

  -- Create policy for INSERT operations
  CREATE POLICY "Authenticated users can insert coupons"
    ON "public"."coupons"
    FOR INSERT
    WITH CHECK (true);  -- Allow everyone to insert coupons

  -- Create policy for UPDATE operations
  CREATE POLICY "Authenticated users can update coupons"
    ON "public"."coupons"
    FOR UPDATE
    USING (true);  -- Allow everyone to update coupons

  -- Create policy for DELETE operations
  CREATE POLICY "Authenticated users can delete coupons"
    ON "public"."coupons"
    FOR DELETE
    USING (true);  -- Allow everyone to delete coupons

  -- Grant all privileges on the coupons table
  GRANT ALL ON "public"."coupons" TO authenticated;
  GRANT ALL ON "public"."coupons" TO service_role;
  GRANT ALL ON "public"."coupons" TO anon;

  -- Reset the sequence if needed
  ALTER SEQUENCE IF EXISTS public.coupons_id_seq RESTART WITH 1;

  RETURN true;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions_with_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions_with_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions_with_admin() TO anon;

-- Execute the function
SELECT fix_coupon_permissions_with_admin();

-- Create a simpler function that can be called from the frontend
CREATE OR REPLACE FUNCTION public.fix_coupon_permissions()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM fix_coupon_permissions_with_admin();
  RETURN true;
END;
$$;

-- Grant execute permission on the simpler function
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION public.fix_coupon_permissions() TO anon;
