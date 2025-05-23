
import React, { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { SquareAspectRatio } from '@/components/ui/square-aspect-ratio';
import { useCarousel } from 'embla-carousel-react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  autoSlideInterval?: number;
}

export function ImageCarousel({ 
  images, 
  className = '', 
  aspectRatio = 'square',
  autoSlideInterval = 0
}: ImageCarouselProps) {
  const [api, setApi] = useState<ReturnType<typeof useCarousel>>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  if (!images || images.length === 0) {
    return null;
  }

  // Set up auto-sliding
  useEffect(() => {
    if (!api || autoSlideInterval <= 0) return;
    
    const sliderCount = api.scrollSnapList().length;
    setCount(sliderCount);
    
    const autoplay = setInterval(() => {
      if (current === sliderCount - 1) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, autoSlideInterval);
    
    return () => clearInterval(autoplay);
  }, [api, current, autoSlideInterval]);

  // Update current slide index when the slide changes
  useEffect(() => {
    if (!api) return;
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <Carousel 
      className={`w-full ${className}`}
      setApi={setApi}
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              {aspectRatio === 'square' ? (
                <SquareAspectRatio className="overflow-hidden rounded-lg">
                  <img 
                    src={image} 
                    alt={`Carousel image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </SquareAspectRatio>
              ) : aspectRatio === 'video' ? (
                <div className="relative w-full pt-[56.25%] overflow-hidden rounded-lg">
                  <img 
                    src={image} 
                    alt={`Carousel image ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : aspectRatio === 'wide' ? (
                <div className="relative w-full pt-[42.85%] overflow-hidden rounded-lg">
                  <img 
                    src={image} 
                    alt={`Carousel image ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg">
                  <img 
                    src={image} 
                    alt={`Carousel image ${index + 1}`}
                    className="w-full h-auto transition-transform duration-700 hover:scale-105"
                  />
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 md:left-8 bg-white/80 backdrop-blur-sm hover:bg-white" />
      <CarouselNext className="absolute right-4 md:right-8 bg-white/80 backdrop-blur-sm hover:bg-white" />
    </Carousel>
  );
}
