import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import LazyImage from '@/components/ui/LazyImage';

interface CarouselItemType {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  product_link: string;
  is_active: boolean;
  display_order: number;
}

export function HeroCarousel() {
  const [carouselItems, setCarouselItems] = useState<CarouselItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const autoSlideInterval = 7000; // 7 seconds in milliseconds

  const fetchCarouselItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching carousel items...');
      
      // Fetch carousel items from Supabase
      // We need to use any type here because the database schema might not be fully defined in TypeScript
      const { data, error } = await supabase
        .from('carousel')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Carousel data received:', data);
      
      if (data && data.length > 0) {
        // Type assertion to ensure data matches our CarouselItemType
        const typedData = data as unknown as CarouselItemType[];
        // Filter to only show active items if needed
        const activeItems = typedData.filter(item => item.is_active);
        console.log('Active carousel items:', activeItems);
        setCarouselItems(activeItems);
      } else {
        console.log('No carousel items found');
        setCarouselItems([]);
      }
    } catch (err) {
      console.error('Error fetching carousel items:', err);
      setError('Failed to load carousel items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarouselItems();
  }, []);

  // Set up auto-sliding functionality
  useEffect(() => {
    if (!api || carouselItems.length <= 1) return;
    
    // Set up auto-sliding timer
    const autoplayTimer = setInterval(() => {
      api.scrollNext();
    }, autoSlideInterval);
    
    // Clean up the timer when component unmounts
    return () => clearInterval(autoplayTimer);
  }, [api, carouselItems.length]);

  if (loading) {
    return <div className="py-10 text-center">Loading carousel...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">{error}</div>;
  }

  if (carouselItems.length === 0) {
    return null; // Don't show anything if there are no items
  }

  return (
    <section className="bg-cream-50 py-6">
      <div className="container-custom">
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {carouselItems.map((item) => (
              <CarouselItem key={item.id} className="md:basis-1/1 lg:basis-1/1">
                <div className="p-1">
                  <Card className="border-none shadow-none">
                    <CardContent className="relative overflow-hidden rounded-xl p-0">
                      <div className="w-full h-[200px] max-h-[200px] md:h-[250px] lg:h-[300px]">
                        <LazyImage 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full"
                          onLoad={() => console.log(`Loaded hero carousel image: ${item.image_url}`)}
                        />
                      </div>
                      {item.product_link && (
                        <div className="absolute bottom-8 right-8">
                          <Button 
                            asChild
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <Link to={item.product_link}>View Product</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12 bg-white/80 hover:bg-white" />
            <CarouselNext className="-right-12 bg-white/80 hover:bg-white" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
