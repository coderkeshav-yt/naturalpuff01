-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    email text,
    full_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create or update the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    order_items jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Drop the product_reviews table if it exists and recreate it
DROP TABLE IF EXISTS public.product_reviews CASCADE;
CREATE TABLE public.product_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    helpful_votes integer DEFAULT 0,
    verified_purchase boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
DO $$ 
BEGIN 
    -- Profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

    -- Orders policies
    DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
    CREATE POLICY "Users can view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
    CREATE POLICY "Users can create own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    -- Reviews policies
    DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.product_reviews;
    CREATE POLICY "Reviews are viewable by everyone" 
    ON public.product_reviews FOR SELECT 
    USING (true);

    DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.product_reviews;
    CREATE POLICY "Users can insert their own reviews" 
    ON public.product_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
    CREATE POLICY "Users can update their own reviews" 
    ON public.product_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;
    CREATE POLICY "Users can delete their own reviews" 
    ON public.product_reviews FOR DELETE 
    USING (auth.uid() = user_id);
END $$;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

GRANT SELECT ON public.orders TO authenticated;
GRANT INSERT, UPDATE ON public.orders TO authenticated;

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;

-- Create a function to check if a user can review a product
CREATE OR REPLACE FUNCTION public.can_review_product(product_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_completed_order boolean;
BEGIN
    -- Check if the user has already reviewed this product
    IF EXISTS (
        SELECT 1 FROM public.product_reviews
        WHERE product_id = product_id_param
        AND user_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;

    -- Check if the user has purchased this product
    SELECT EXISTS (
        SELECT 1 
        FROM public.orders o
        WHERE o.user_id = auth.uid()
        AND o.status = 'completed'
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(o.order_items) AS items
            WHERE (items->>'product_id')::integer = product_id_param
        )
    ) INTO has_completed_order;

    RETURN has_completed_order;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.can_review_product(integer) TO authenticated; 