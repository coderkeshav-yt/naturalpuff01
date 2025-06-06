-- Create or replace the can_review_product function
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