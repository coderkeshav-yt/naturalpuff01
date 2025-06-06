import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useProductStatus } from '@/hooks/use-product-status';
import { ProductImageCarousel } from '@/components/ui/product-image-carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Product, ProductVariant } from '@/types/product';

// Extended Product interface with additional fields for display purposes
interface ExtendedProduct extends Product {
  formattedDetails?: string; // Formatted details for display
  categoryName?: string; // Parsed category name
  image_urls?: string[]; // Array of image URLs
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  // Helper function to process product data
  const processProductData = (rawData: any): ExtendedProduct => {
    try {
      // Process details - could be a JSON string or already an object
      let details = rawData.details;
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
        } catch (e) {
          // If parsing fails, keep as string
          details = { description: details };
        }
      }

      // Format details for display
      const formattedDetails = typeof details === 'object' ? 
        Object.entries(details)
          .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${value}`)
          .join('\n') : 
        details;

      // Process image URLs - could be a JSON string or already an array
      let imageUrls = rawData.image_urls;
      if (typeof imageUrls === 'string') {
        try {
          imageUrls = JSON.parse(imageUrls);
        } catch (e) {
          // If parsing fails, use single image URL
          imageUrls = [rawData.image_url];
        }
      }
      
      // Ensure imageUrls is an array
      if (!Array.isArray(imageUrls)) {
        imageUrls = imageUrls ? [imageUrls] : [rawData.image_url];
      }

      // Process variants - could be a JSON string or already an array
      let variants = rawData.variants;
      if (typeof variants === 'string') {
        try {
          variants = JSON.parse(variants);
        } catch (e) {
          // If parsing fails, create a single default variant with the product's price
          variants = [
            { size: "Regular", price: rawData.price }
          ];
        }
      }
      
      // Ensure variants is an array with at least one item
      if (!Array.isArray(variants) || variants.length === 0) {
        // Create a single default variant with the product's price
        variants = [
          { size: "Regular", price: rawData.price }
        ];
      }

      // Process category - could be a JSON string or already an object
      let category = rawData.category;
      let categoryName = '';
      if (typeof category === 'string') {
        try {
          const parsedCategory = JSON.parse(category);
          category = parsedCategory;
          categoryName = parsedCategory.name || '';
        } catch (e) {
          // If parsing fails, use as is
          categoryName = category;
        }
      } else if (category && typeof category === 'object') {
        categoryName = category.name || '';
      }

      // Generate slug if not present
      const slug = rawData.slug || rawData.name.toLowerCase().replace(/\s+/g, '-');

      // Use actual data for rating and discount, with safe fallbacks
      const rating = rawData.rating || 4.5; // Use fixed value instead of random
      const discount_percent = rawData.discount_percent || 0; // Don't add random discounts

      return {
        ...rawData,
        details,
        formattedDetails,
        image_urls: imageUrls,
        variants,
        category,
        categoryName,
        slug,
        rating,
        discount_percent
      };
    } catch (error) {
      console.error("Error processing product data:", error);
      return rawData; // Return raw data if processing fails
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if productId is numeric (ID) or string (slug)
      const isNumeric = /^\d+$/.test(productId || '');

      let productData = null;

      if (isNumeric) {
        // Fetch by ID
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', parseInt(productId!, 10))
          .single();

        if (error) throw error;
        productData = data;
      } else {
        // Fetch all products and filter by slug or name client-side
        // This avoids JSON query issues
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Try to find by slug first
          productData = data.find(p => {
            // Generate slug if not present
            const productSlug = p.slug || p.name.toLowerCase().replace(/\s+/g, '-');
            return productSlug === productId;
          });

          // If not found by slug, try by name
          if (!productData) {
            productData = data.find(p => 
              p.name.toLowerCase().replace(/\s+/g, '-') === productId?.toLowerCase()
            );
          }
        }
      }

      if (!productData) {
        throw new Error('Product not found');
      }

      // Process the product data
      const processedProduct = processProductData(productData);
      
      // Set the product and default selected variant
      setProduct(processedProduct);
      if (processedProduct.variants && processedProduct.variants.length > 0) {
        setSelectedVariant(processedProduct.variants[0].size);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product on component mount
  useEffect(() => {
    fetchProductDetails();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [productId]);

  // Get product status using custom hook
  const productStatus = product ? useProductStatus(product) : { 
    statusText: '', 
    statusClass: '', 
    badgeClass: '', 
    isOutOfStock: false 
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const selectedVariantObj = product.variants?.find(v => v.size === selectedVariant);
    if (!selectedVariantObj) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: selectedVariantObj.price,
      image_url: product.image_urls?.[0] || product.image_url,
      quantity: 1,
      variant: selectedVariant
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedVariant}) has been added to your cart.`,
    });
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    
    const selectedVariantObj = product.variants?.find(v => v.size === selectedVariant);
    if (!selectedVariantObj) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: selectedVariantObj.price,
      image_url: product.image_urls?.[0] || product.image_url,
      quantity: 1,
      variant: selectedVariant
    });
    
    // Navigate to checkout
    navigate('/checkout');
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="fill-yellow-400 text-yellow-400" size={16} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="text-gray-300" size={16} />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star className="fill-yellow-400 text-yellow-400" size={16} />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="text-gray-300" size={16} />);
      }
    }
    
    return <div className="flex items-center">{stars}</div>;
  };

  // Get selected variant price
  const getSelectedVariantPrice = () => {
    if (!product) return 0;
    
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.size === selectedVariant);
      return variant ? variant.price : product.variants[0].price;
    }
    
    return product.price;
  };

  // Get discounted price
  const getDiscountedPrice = () => {
    const price = getSelectedVariantPrice();
    const discount = product?.discount_percent || 0;
    return Math.round(price - (price * discount / 100));
  };

  // Function to get real-time stock from database
  const getRealTimeStock = () => {
    return product?.stock || 0;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-24 w-full mb-6" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-12 w-1/3" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h2>
        <p className="mb-6">{error || 'Product not found'}</p>
        <Button onClick={() => navigate('/products')}>Return to Products</Button>
      </div>
    );
  }

  // Render product detail
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <ProductImageCarousel 
            images={product.image_urls || [product.image_url]} 
            alt={product.name} 
          />
        </div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          {/* Product Title and Category */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.categoryName && (
              <Badge variant="outline" className="text-xs">
                {product.categoryName}
              </Badge>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            {renderStarRating(product.rating || 4.5)}
            <span className="text-sm text-gray-500">
              ({product.rating?.toFixed(1) || '4.5'}) ratings
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                ${getDiscountedPrice()}
              </span>
              {product.discount_percent && product.discount_percent > 0 && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ${getSelectedVariantPrice()}
                  </span>
                  <Badge variant="destructive" className="ml-2">
                    {product.discount_percent}% OFF
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.size}
                    variant={selectedVariant === variant.size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVariant(variant.size)}
                  >
                    {variant.size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-6">
            <Badge 
              variant={productStatus.badgeClass as any} 
              className="text-xs"
            >
              {productStatus.statusText}
            </Badge>
            <p className="text-sm mt-1">
              {getRealTimeStock()} items available
            </p>
          </div>

          {/* Add to Cart and Buy Now */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              onClick={handleAddToCart} 
              variant="outline" 
              size="lg"
              className="flex-1"
              disabled={productStatus.isOutOfStock}
            >
              Add to Cart
            </Button>
            <Button 
              onClick={handleBuyNow} 
              size="lg"
              className="flex-1"
              disabled={productStatus.isOutOfStock}
            >
              Buy Now
            </Button>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {product.description}
              </p>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {product.formattedDetails || 'No detailed information available'}
              </p>
            </TabsContent>
            <TabsContent value="nutrition" className="mt-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {product.nutritional_info || 'Nutritional information not available'}
              </p>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
