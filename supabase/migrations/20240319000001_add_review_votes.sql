-- Create review_votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id uuid REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all votes"
    ON public.review_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own votes"
    ON public.review_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to handle helpful votes
CREATE OR REPLACE FUNCTION public.vote_review_helpful(review_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the vote
    INSERT INTO public.review_votes (review_id, user_id)
    VALUES (review_id_param, auth.uid());

    -- Update the helpful_votes count
    UPDATE public.product_reviews
    SET helpful_votes = helpful_votes + 1
    WHERE id = review_id_param;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON public.review_votes TO authenticated;
GRANT SELECT ON public.review_votes TO anon;
GRANT EXECUTE ON FUNCTION public.vote_review_helpful(uuid) TO authenticated; 