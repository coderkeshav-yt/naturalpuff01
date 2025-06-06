import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';
import { useToast } from './use-toast';
import { Avatar } from './avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './badge';
import { Database } from '@/types/supabase';

type Review = Database['public']['Tables']['product_reviews']['Row'] & {
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  user_name?: string;
  id: string;
};

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching reviews for product:', productId);

      // First fetch the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setError(reviewsError.message);
        return;
      }

      console.log('Raw reviews data:', reviewsData);

      // Then fetch profile data for each review
      const reviewsWithProfiles = await Promise.all((reviewsData || []).map(async (review) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', review.user_id)
          .single();

        console.log('Profile data for review:', profileData);
        
        return {
          ...review,
          user_name: profileData?.full_name || profileData?.email?.split('@')[0] || 'Anonymous User'
        };
      }));

      console.log('Processed reviews:', reviewsWithProfiles);
      setReviews(reviewsWithProfiles);

      // Calculate average rating
      if (reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((acc, curr) => acc + curr.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalReviews(reviewsWithProfiles.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserCanReview = async () => {
    if (!user) {
      console.log('No user logged in');
      setCanReview(false);
      return;
    }

    try {
      console.log('Current user:', user.id);
      console.log('Checking orders for product ID:', productId);

      // First check if user has any completed orders with this product
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      console.log('All completed orders:', orders);

      // Check if any order contains this product
      const hasProduct = orders?.some(order => {
        console.log('Checking order:', order.id);
        console.log('Order items:', order.order_items);
        
        const items = Array.isArray(order.order_items) ? order.order_items : [];
        return items.some((item: any) => {
          console.log('Checking item:', item);
          // Convert both to numbers for comparison
          const orderProductId = typeof item.product_id === 'string' 
            ? parseInt(item.product_id, 10) 
            : item.product_id;
          
          console.log('Comparing product IDs:', {
            orderProductId,
            currentProductId: productId,
            matches: orderProductId === productId
          });
          
          return orderProductId === productId;
        });
      });

      console.log('Has product in orders:', hasProduct);

      if (!hasProduct) {
        console.log('User has not purchased this product');
        setCanReview(false);
        return;
      }

      // Check if user has already reviewed
      const { data: existingReviews, error: reviewError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (reviewError) {
        console.error('Error checking existing reviews:', reviewError);
        throw reviewError;
      }

      console.log('Existing reviews:', existingReviews);

      if (existingReviews && existingReviews.length > 0) {
        console.log('User has already reviewed this product');
        setCanReview(false);
        return;
      }

      // If we get here, user can review
      console.log('User can review the product');
      setCanReview(true);

    } catch (error) {
      console.error('Error in checkIfUserCanReview:', error);
      setCanReview(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      console.log('Submitting review for product:', productId);
      console.log('Review data:', { rating, reviewText });

      // First check if user has already reviewed
      const { data: existingReviews, error: checkError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (checkError) {
        console.error('Error checking existing reviews:', checkError);
        throw checkError;
      }

      if (existingReviews && existingReviews.length > 0) {
        throw new Error('You have already reviewed this product');
      }

      // Get the order ID
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        throw orderError;
      }

      console.log('Found order:', orderData);

      // Submit the review
      const { error: submitError } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: rating,
          review_text: reviewText,
          order_id: orderData?.id,
          verified_purchase: true
        });

      if (submitError) {
        console.error('Error submitting review:', submitError);
        throw submitError;
      }

      toast({
        title: 'Success',
        description: 'Your review has been submitted successfully!',
      });

      // Reset form and refresh reviews
      setRating(5);
      setReviewText('');
      setCanReview(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to mark reviews as helpful.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .rpc('vote_review_helpful', { review_id_param: reviewId });

      if (error) throw error;

      // Refresh the reviews to show updated helpful count
      fetchReviews();

      toast({
        title: 'Thank you!',
        description: 'You marked this review as helpful.',
      });
    } catch (error) {
      console.error('Error voting review as helpful:', error);
      if (error instanceof Error && error.message.includes('review_votes_review_id_user_id_key')) {
        toast({
          title: 'Already voted',
          description: 'You have already marked this review as helpful.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to mark review as helpful. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    console.log('ProductReviews mounted, productId:', productId);
    fetchReviews();
    if (user) {
      checkIfUserCanReview();
    }
  }, [productId, user]);

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        Error loading reviews: {error}
        <button
          onClick={() => fetchReviews()}
          className="ml-2 text-brand-600 hover:text-brand-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      
      {/* Review Summary */}
      <div className="bg-cream-50 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-3xl font-bold text-brand-600">{averageRating}</div>
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="text-sm text-gray-500">({totalReviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {user ? (
        canReview ? (
          <form onSubmit={handleSubmitReview} className="bg-cream-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(rating, true)}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..."
                className="min-h-[100px]"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        ) : (
          <div className="bg-cream-50 p-4 rounded-lg mb-6 text-center">
            {reviews.some(r => r.user_id === user.id) ? (
              <p>You have already reviewed this product.</p>
            ) : (
              <p>You need to purchase this product to write a review.</p>
            )}
          </div>
        )
      ) : (
        <div className="bg-cream-50 p-4 rounded-lg mb-6 text-center">
          <p>Please sign in to write a review.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <div className="bg-brand-100 w-full h-full flex items-center justify-center text-brand-600 font-semibold">
                      {review.user_name?.[0] || 'A'}
                    </div>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{review.user_name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {review.verified_purchase && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                {renderStars(review.rating)}
              </div>
              <p className="mt-2 text-gray-700">{review.review_text}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleHelpfulVote(review.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful_votes || 0})
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            No reviews yet. Be the first to review this product!
          </div>
        )}
      </div>
    </div>
  );
}; 