-- Add min_order_value column to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing rows to have an updated_at value if they don't already
UPDATE public.coupons SET updated_at = now() WHERE updated_at IS NULL;

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
CREATE POLICY "Admins can manage all coupons" 
  ON public.coupons 
  USING (auth.jwt() ? 'is_admin' = 'true')
  WITH CHECK (auth.jwt() ? 'is_admin' = 'true');

-- Add comment to the column
COMMENT ON COLUMN public.coupons.min_order_value IS 'Minimum order value required for the coupon to be applicable';
