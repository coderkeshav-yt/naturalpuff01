-- Add shipping_details column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_details JSONB DEFAULT '{}'::jsonb;

-- Add tracking_info column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_info JSONB DEFAULT '{}'::jsonb;

-- Add shipping_status column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';

-- Create index on shipping_status for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
