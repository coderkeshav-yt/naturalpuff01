
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { MarketingOffer } from '@/types/product';

interface OfferCarouselProps {
  autoSlideInterval?: number; // in milliseconds
  maxItems?: number;
}

export const OfferCarousel: React.FC<OfferCarouselProps> = ({
  autoSlideInterval = 4000,
  maxItems = 5
}) => {
  const [offers, setOffers] = useState<MarketingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current date for filtering expired offers
      const now = new Date().toISOString();
      
      // Fetch offers from the database that haven't expired yet
      const { data, error } = await supabase
        .from('marketing_offers')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setOffers(data as MarketingOffer[]);
      } else {
        setOffers([]);
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load promotional offers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // If no offers or error, don't render the component
  if ((offers.length === 0 && !loading) || error) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Extract only the image URLs for the carousel
  const offerImages = offers.map(offer => offer.image_url);

  return (
    <div className="w-full my-8">
      <Card className="border-none shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-2xl font-playfair text-brand-800">Special Offers</CardTitle>
          <CardDescription>Check out our latest promotions and deals</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ImageCarousel 
            images={offerImages} 
            aspectRatio="wide" 
            className="overflow-hidden rounded-lg"
            autoSlideInterval={autoSlideInterval}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferCarousel;
