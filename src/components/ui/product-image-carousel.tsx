import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LazyImage from '@/components/ui/LazyImage';

interface ProductImageCarouselProps {
  images: string[] | undefined;
  alt: string;
  className?: string;
}

export function ProductImageCarousel({ images = [], alt, className = '' }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Process images on component mount and when images prop changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure images is an array and filter out any empty strings or undefined values
      const validImages = Array.isArray(images) 
        ? images
            .filter(img => {
              const isValid = img && typeof img === 'string' && img.trim() !== '';
              if (!isValid) {
                console.warn('Invalid image URL:', img);
              }
              return isValid;
            })
            .map(img => {
              // Ensure the URL is properly formatted
              try {
                new URL(img);
                return img;
              } catch (e) {
                console.warn('Invalid image URL format:', img);
                return '';
              }
            })
            .filter(Boolean) as string[]
        : [];
      
      console.log('Processed images:', validImages);
      setProcessedImages(validImages);
      // Reset current index if we have a new set of images
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Failed to load images');
      setProcessedImages([]);
    } finally {
      setLoading(false);
    }
  }, [images]);
  
  // Handle loading and error states
  if (loading) {
    return (
      <div className={`relative ${className} bg-gray-100 flex items-center justify-center`}>
        <div className="animate-pulse w-full h-full bg-gray-200"></div>
      </div>
    );
  }

  // If no images are provided or error occurred, show a placeholder
  if (error || !processedImages || processedImages.length === 0) {
    return (
      <div className={`relative ${className} bg-gray-100 flex flex-col items-center justify-center p-4`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm text-center">
          {error || 'No images available'}
        </p>
      </div>
    );
  }
  
  // If only one image, show it with hover effect but without controls
  if (processedImages.length === 1) {
    return (
      <div className={`relative ${className} group`}>
        <LazyImage 
          src={processedImages[0]} 
          alt={alt}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          placeholderSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlOWVjZWYiLz48L3N2Zz4="
          onLoad={() => console.log(`Loaded image: ${processedImages[0]}`)}
        />
      </div>
    );
  }
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === processedImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? processedImages.length - 1 : prevIndex - 1
    );
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  
  return (
    <div className={`relative ${className} group`}>
      {/* Main image */}
      <LazyImage 
        src={processedImages[currentIndex]} 
        alt={`${alt} - image ${currentIndex + 1}`}
        className="w-full h-full"
        placeholderSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlOWVjZWYiLz48L3N2Zz4="
        onLoad={() => console.log(`Loaded carousel image: ${processedImages[currentIndex]}`)}
      />
      
      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-8 w-8 p-1.5 shadow-md"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-5 w-5 text-brand-800" />
        <span className="sr-only">Previous image</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-8 w-8 p-1.5 shadow-md"
        onClick={nextSlide}
      >
        <ChevronRight className="h-5 w-5 text-brand-800" />
        <span className="sr-only">Next image</span>
      </Button>
      
      {/* Thumbnail indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {processedImages.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/60 hover:bg-white/80'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
