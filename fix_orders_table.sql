-- First, check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_items'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN order_items JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Now update the order
UPDATE public.orders
SET 
    status = 'completed',
    order_items = '[{"product_id": 24, "quantity": 1}]'::jsonb
WHERE id = '01756332-78e1-42b9-bac6-b9d310e97f5e'; 