import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/price-display';

interface ProductRecommendationsProps {
  products: Product[];
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-brand-800 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {product.discount_percent && product.discount_percent > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-brand-700 line-clamp-1">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <PriceDisplay 
                  price={product.price} 
                  discountPercent={product.discount_percent} 
                  discountedPrice={product.discount_percent && product.discount_percent > 0 ? 
                    Math.round(product.price * (1 - product.discount_percent / 100)) : 
                    undefined
                  }
                  size="sm"
                />
              </div>
              <Link to={`/product/${product.slug || product.id}`} className="block mt-3">
                <Button 
                  variant="outline" 
                  className="w-full border-brand-600 text-brand-600 hover:bg-brand-50"
                >
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
