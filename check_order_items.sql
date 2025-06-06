-- First, let's check what's in the order_items
SELECT id, order_items, status FROM public.orders 
WHERE id = '01756332-78e1-42b9-bac6-b9d310e97f5e';

-- Then update the order with the correct product ID and status
UPDATE public.orders
SET 
    status = 'completed',
    order_items = jsonb_build_array(
        jsonb_build_object(
            'product_id', 24,
            'quantity', 1
        )
    )
WHERE id = '01756332-78e1-42b9-bac6-b9d310e97f5e'; 