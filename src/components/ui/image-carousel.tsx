
import React, { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { SquareAspectRatio } from '@/components/ui/square-aspect-ratio';
import useEmblaCarousel from 'embla-carousel-react';
import LazyImage from '@/components/ui/LazyImage';

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
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  
  if (!images || images.length === 0) {
    return null;
  }

  // Set up auto-sliding
  useEffect(() => {
    if (!emblaApi || autoSlideInterval <= 0) return;
    
    const sliderCount = emblaApi.slideNodes().length;
    setCount(sliderCount);
    
    const autoplay = setInterval(() => {
      if (current === sliderCount - 1) {
        emblaApi.scrollTo(0);
      } else {
        emblaApi.scrollNext();
      }
    }, autoSlideInterval);
    
    return () => clearInterval(autoplay);
  }, [emblaApi, current, autoSlideInterval]);

  // Update current slide index when the slide changes
  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on("select", () => {
      setCurrent(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  return (
    <div className={`w-full ${className}`} ref={emblaRef}>
      <Carousel>
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                {aspectRatio === 'square' ? (
                  <SquareAspectRatio className="overflow-hidden rounded-lg">
                    <LazyImage 
                      src={image} 
                      alt={`Carousel image ${index + 1}`}
                      className="w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </SquareAspectRatio>
                ) : aspectRatio === 'video' ? (
                  <div className="relative w-full pt-[56.25%] overflow-hidden rounded-lg">
                    <LazyImage 
                      src={image} 
                      alt={`Carousel image ${index + 1}`}
                      className="absolute inset-0 w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ) : aspectRatio === 'wide' ? (
                  <div className="relative w-full pt-[42.85%] overflow-hidden rounded-lg">
                    <LazyImage 
                      src={image} 
                      alt={`Carousel image ${index + 1}`}
                      className="absolute inset-0 w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg">
                    <LazyImage 
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
    </div>
  );
}
