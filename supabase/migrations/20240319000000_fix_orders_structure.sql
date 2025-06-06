-- Drop existing triggers if any
DROP TRIGGER IF EXISTS ensure_order_items_trigger ON orders;

-- Ensure orders table has the correct structure
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    total_amount integer,
    order_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_id text,
    shipping_address jsonb,
    shipping_details jsonb,
    tracking_info jsonb,
    shipping_status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    CONSTRAINT valid_shipping_status CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Create a function to validate order_items
CREATE OR REPLACE FUNCTION public.validate_order_items()
RETURNS trigger AS $$
BEGIN
    -- Ensure order_items is an array
    IF NOT jsonb_typeof(NEW.order_items) = 'array' THEN
        RAISE EXCEPTION 'order_items must be an array';
    END IF;

    -- Validate each item in the array
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(NEW.order_items) AS item
        WHERE NOT (
            (item->>'product_id') IS NOT NULL
            AND (item->>'quantity') IS NOT NULL
            AND (item->>'quantity')::int > 0
        )
    ) THEN
        RAISE EXCEPTION 'Each order item must have a product_id and a positive quantity';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate order_items
CREATE TRIGGER ensure_order_items_trigger
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_items();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon; 