import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlOWVjZWYiLz48L3N2Zz4=',
  width,
  height,
  onLoad,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setImageSrc(placeholderSrc);
    
    if (imgRef.current) {
      // Disconnect previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new IntersectionObserver
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Load the actual image when it enters viewport
          const img = new Image();
          img.src = src;
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            if (onLoad) onLoad();
            
            // Disconnect observer after loading
            if (observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          };
          
          img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            // Keep placeholder on error
            if (observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          };
        }
      }, {
        rootMargin: '200px 0px', // Start loading when image is 200px from viewport
        threshold: 0.01
      });

      // Start observing the image element
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [src, placeholderSrc, onLoad]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-60'}`}
        style={{ objectFit: 'cover' }}
        width={width}
        height={height}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-20">
          <div className="animate-pulse rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
