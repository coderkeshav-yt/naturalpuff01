-- Add full_name column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name text;
    END IF;
END $$;

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_items jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Create product_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    helpful_votes integer DEFAULT 0,
    verified_purchase boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster review lookups
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product_reviews
DO $$ 
BEGIN 
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON product_reviews;
    DROP POLICY IF EXISTS "Users can insert their own reviews" ON product_reviews;
    DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
    DROP POLICY IF EXISTS "Users can delete their own reviews" ON product_reviews;
    
    -- Create new policies
    CREATE POLICY "Reviews are viewable by everyone" 
    ON product_reviews FOR SELECT 
    USING (true);

    CREATE POLICY "Users can insert their own reviews" 
    ON product_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own reviews" 
    ON product_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own reviews" 
    ON product_reviews FOR DELETE 
    USING (auth.uid() = user_id);
END $$;

-- Grant necessary permissions
GRANT SELECT ON product_reviews TO anon;
GRANT SELECT ON product_reviews TO authenticated;
GRANT INSERT, UPDATE, DELETE ON product_reviews TO authenticated;

-- Update the profiles table to ensure it has email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text; 