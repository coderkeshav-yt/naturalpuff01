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
  // Get slug from URL params
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Helper function to process product data
  const processProductData = (rawData: any): ExtendedProduct => {
    try {
      console.log('Processing raw product data:', rawData);
      
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
          .filter(([key]) => !['category', 'image_urls'].includes(key))
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') 
        : details;

      // Get category name
      let categoryName = 'General';
      if (typeof rawData.category === 'string') {
        try {
          const categoryObj = JSON.parse(rawData.category);
          categoryName = categoryObj.name || 'General';
        } catch (e) {
          categoryName = rawData.category;
        }
      }

      // Process image URLs
      let image_urls: string[] = [];
      
      // First check if image_urls is directly on the product
      if (rawData.image_urls) {
        if (typeof rawData.image_urls === 'string') {
          try {
            image_urls = JSON.parse(rawData.image_urls);
          } catch (e) {
            image_urls = [rawData.image_urls];
          }
        } else if (Array.isArray(rawData.image_urls)) {
          image_urls = rawData.image_urls;
        }
      }
      
      // If no image_urls found, check in details
      if (image_urls.length === 0 && details && details.image_urls) {
        if (Array.isArray(details.image_urls)) {
          image_urls = details.image_urls;
        }
      }
      
      // If still no images, use the single image_url as fallback
      if (image_urls.length === 0 && rawData.image_url) {
        image_urls = [rawData.image_url];
      }
      
      // Process variants
      let variants: ProductVariant[] = [];
      
      // First try to get variants from the variants field
      if (rawData.variants) {
        if (typeof rawData.variants === 'string') {
          try {
            variants = JSON.parse(rawData.variants);
            console.log('Parsed variants from string:', variants);
          } catch (e) {
            console.error('Error parsing variants:', e);
          }
        } else if (Array.isArray(rawData.variants)) {
          variants = rawData.variants;
          console.log('Using array variants:', variants);
        }
      }
      
      // If no variants found, check if we have size_options in details
      if (variants.length === 0 && details && details.size_options) {
        try {
          let sizeOptions = details.size_options;
          if (typeof sizeOptions === 'string') {
            sizeOptions = JSON.parse(sizeOptions);
          }
          
          if (Array.isArray(sizeOptions)) {
            console.log('Creating variants from size_options:', sizeOptions);
            variants = sizeOptions.map(size => ({
              size: size,
              price: rawData.price,
              stock: rawData.stock
            }));
          }
        } catch (e) {
          console.error('Error processing size_options:', e);
        }
      }
      
      // If still no variants, create standard size options (50g and 100g)
      if (variants.length === 0) {
        console.log('Creating default 50g/100g variants');
        variants = [
          {
            size: '50g',
            price: rawData.price,
            stock: rawData.stock
          },
          {
            size: '100g',
            price: Math.round(rawData.price * 1.8), // 100g is 1.8x the price of 50g
            stock: rawData.stock
          }
        ];
      }
      
      // Ensure all variants have required properties
      variants = variants.map(v => ({
        size: v.size || 'Default',
        price: v.price || rawData.price,
        stock: v.stock !== undefined ? v.stock : rawData.stock
      }));
      
      console.log('Final variants:', variants);

      return {
        ...rawData,
        formattedDetails,
        categoryName,
        image_urls,
        variants,
        rating: rawData.rating || 4.5,
        discount_percent: rawData.discount_percent || 0
      };
    } catch (error) {
      console.error('Error processing product data:', error);
      return rawData;
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    let newDebugInfo = "";
    try {
      setLoading(true);
      setError(null);

      if (!slug) {
        throw new Error('No product slug provided');
      }

      console.log('Fetching product with slug:', slug);
      newDebugInfo += `\nAttempting to fetch product with slug: ${slug}`;

      // First try direct query by slug
      let { data: productBySlug, error: slugError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (slugError) {
        console.error('Error fetching by slug:', slugError);
        newDebugInfo += `\nError fetching by slug: ${slugError.message}`;
      }

      // If found by slug, use it
      if (productBySlug) {
        console.log('Found product by slug:', productBySlug.name);
        newDebugInfo += `\nFound product by slug: ${productBySlug.name}`;
        
        const processedProduct = processProductData(productBySlug);
        setProduct(processedProduct);
        
        if (processedProduct.variants && processedProduct.variants.length > 0) {
          setSelectedVariant(processedProduct.variants[0].size);
        }
        
        window.scrollTo(0, 0);
        setDebugInfo(newDebugInfo);
        return;
      }

      // If not found by slug, check if it's a numeric ID
      const isNumeric = /^\d+$/.test(slug);
      if (isNumeric) {
        const numericId = parseInt(slug, 10);
        console.log('Looking for product by ID:', numericId);
        newDebugInfo += `\nLooking for product by ID: ${numericId}`;
        
        const { data: productById, error: idError } = await supabase
          .from('products')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();
          
        if (idError) {
          console.error('Error fetching by ID:', idError);
          newDebugInfo += `\nError fetching by ID: ${idError.message}`;
        }
        
        if (productById) {
          console.log('Found product by ID:', productById.name);
          newDebugInfo += `\nFound product by ID: ${productById.name}`;
          
          const processedProduct = processProductData(productById);
          setProduct(processedProduct);
          
          if (processedProduct.variants && processedProduct.variants.length > 0) {
            setSelectedVariant(processedProduct.variants[0].size);
          }
          
          window.scrollTo(0, 0);
          setDebugInfo(newDebugInfo);
          return;
        }
      }

      // If not found by direct queries, try fetching all products and searching
      console.log('Trying fallback: fetching all products');
      newDebugInfo += `\nTrying fallback: fetching all products`;
      
      const { data: allProducts, error: allProductsError } = await supabase
        .from('products')
        .select('*');
        
      if (allProductsError) {
        console.error('Error fetching all products:', allProductsError);
        newDebugInfo += `\nError fetching all products: ${allProductsError.message}`;
        throw allProductsError;
      }
      
      if (!allProducts || allProducts.length === 0) {
        console.error('No products found in database');
        newDebugInfo += `\nNo products found in database`;
        throw new Error('No products found in database');
      }
      
      console.log(`Found ${allProducts.length} products in database`);
      newDebugInfo += `\nFound ${allProducts.length} products in database`;
      
      // Try multiple matching strategies
      let productData = null;
      
      // Strategy 1: Name-based slug match
      if (!productData) {
        productData = allProducts.find(p => {
          if (!p.name) return false;
          const nameSlug = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return nameSlug === slug.toLowerCase();
        });
        
        if (productData) {
          console.log('Found by name-based slug:', productData.name);
          newDebugInfo += `\nFound by name-based slug: ${productData.name}`;
        }
      }
      
      // Strategy 2: Partial name match
      if (!productData) {
        const searchTerm = slug.toLowerCase().replace(/-/g, ' ');
        productData = allProducts.find(p => 
          p.name && p.name.toLowerCase().includes(searchTerm)
        );
        
        if (productData) {
          console.log('Found by partial name match:', productData.name);
          newDebugInfo += `\nFound by partial name match: ${productData.name}`;
        }
      }
      
      // Strategy 3: Any substring match in name
      if (!productData) {
        const searchTerm = slug.toLowerCase().replace(/-/g, '');
        productData = allProducts.find(p => 
          p.name && p.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm)
        );
        
        if (productData) {
          console.log('Found by substring match:', productData.name);
          newDebugInfo += `\nFound by substring match: ${productData.name}`;
        }
      }
      
      // If still not found, try the first product as a last resort
      if (!productData && allProducts.length > 0) {
        productData = allProducts[0];
        console.log('Using first product as fallback:', productData.name);
        newDebugInfo += `\nUsing first product as fallback: ${productData.name}`;
      }

      if (!productData) {
        console.error('Product not found with any matching strategy');
        newDebugInfo += `\nProduct not found with any matching strategy`;
        throw new Error(`Product not found with slug: ${slug}`);
      }
      
      console.log('Using product:', productData.name);
      newDebugInfo += `\nUsing product: ${productData.name}`;

      // Process the product data
      const processedProduct = processProductData(productData);
      console.log('Processed product:', processedProduct);
      
      // Set product and default selected variant
      setProduct(processedProduct);
      
      // Set the first variant as the default selected variant if available
      if (processedProduct.variants && processedProduct.variants.length > 0) {
        setSelectedVariant(processedProduct.variants[0].size);
      }

      // Scroll to top when product loads
      window.scrollTo(0, 0);
      setDebugInfo(newDebugInfo);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product');
      newDebugInfo += `\nError: ${err.message || 'Failed to load product'}`;
      setDebugInfo(newDebugInfo);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product on mount or when slug changes
  useEffect(() => {
    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);

  // Get the selected variant object
  const getSelectedVariantObj = () => {
    if (!product || !product.variants) return null;
    return product.variants.find(v => v.size === selectedVariant);
  };

  // Get the price of the selected variant
  const getSelectedVariantPrice = () => {
    const variant = getSelectedVariantObj();
    return variant ? variant.price : (product?.price || 0);
  };

  // Calculate discounted price
  const getDiscountedPrice = () => {
    const price = getSelectedVariantPrice();
    const discount = product?.discount_percent || 0;
    return Math.round(price - (price * discount / 100));
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    // Get the selected variant object
    const selectedVariantObj = getSelectedVariantObj();
    
    // Create cart item with required properties
    const cartItem = {
      id: product.id,
      name: product.name,
      price: getDiscountedPrice(),
      image_url: product.image_urls?.[0] || product.image_url,
      quantity: 1,
      variant: selectedVariant !== 'Default' ? selectedVariant : undefined
    };
    
    // Add to cart
    addItem(cartItem);
    
    // Show success toast
    toast({
      title: "Added to Cart",
      description: `${product.name} (${selectedVariant}) has been added to your cart.`,
      duration: 3000,
    });
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!product) return;
    
    // Add to cart first
    handleAddToCart();
    
    // Navigate to checkout
    navigate('/checkout');
  };

  // Check if product is in stock
  const isInStock = () => {
    if (!product) return false;
    
    const variant = getSelectedVariantObj();
    if (variant) {
      return variant.stock === undefined || variant.stock > 0;
    }
    
    return product.stock === undefined || product.stock > 0;
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="fill-gold-500 text-gold-500 h-5 w-5" />
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="text-gray-300 h-5 w-5" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="fill-gold-500 text-gold-500 h-5 w-5" />
          </div>
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="text-gray-300 h-5 w-5" />
      );
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div className="md:w-1/2">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-6" />
            <div className="flex gap-2 mb-6">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error Loading Product</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/products')} className="bg-brand-600 hover:bg-brand-700">
            Return to Products
          </Button>
          
          {/* Debug information */}
          {debugInfo && (
            <div className="mt-8 text-left bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
              <h3 className="font-bold mb-2">Debug Information:</h3>
              <pre>{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No product found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-amber-700 mb-4">Product Not Found</h2>
          <p className="text-amber-600 mb-6">We couldn't find the product you're looking for.</p>
          <Button onClick={() => navigate('/products')} className="bg-brand-600 hover:bg-brand-700">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-brand-600">Home</button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate('/products')} className="hover:text-brand-600">Products</button>
        <span className="mx-2">/</span>
        <span className="text-brand-600">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Images */}
        <div className="md:w-1/2">
          <ProductImageCarousel 
            images={product.image_urls || [product.image_url]} 
            className="rounded-lg overflow-hidden"
            alt={`${product.name} product images`}
          />
        </div>

        {/* Product Details */}
        <div className="md:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-brand-800 mb-2">{product.name}</h1>
            
            {/* Category Badge */}
            <div className="mb-4">
              <Badge variant="outline" className="text-brand-600 border-brand-600">
                {product.categoryName || 'General'}
              </Badge>
            </div>
            
            {/* Ratings */}
            <div className="mb-4">
              {renderStarRating(product.rating || 4.5)}
            </div>
            
            {/* Price */}
            <div className="mb-6">
              {product.discount_percent && product.discount_percent > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-brand-600">₹{getDiscountedPrice()}</span>
                  <span className="text-lg text-gray-500 line-through">₹{getSelectedVariantPrice()}</span>
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                    {product.discount_percent}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-brand-600">₹{getSelectedVariantPrice()}</span>
              )}
            </div>
            
            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Size Options:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    // Calculate price difference for display
                    const priceDiff = variant.price - product.price;
                    const priceDiffText = priceDiff > 0 
                      ? ` (+₹${priceDiff})` 
                      : priceDiff < 0 
                      ? ` (-₹${Math.abs(priceDiff)})` 
                      : '';
                        
                    return (
                      <Button
                        key={variant.size}
                        variant={selectedVariant === variant.size ? "default" : "outline"}
                        className={selectedVariant === variant.size 
                          ? "bg-brand-600 hover:bg-brand-700" 
                          : "hover:bg-brand-100"}
                        onClick={() => setSelectedVariant(variant.size)}
                        disabled={variant.stock !== undefined && variant.stock <= 0}
                      >
                        {variant.size}{priceDiffText}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Stock Status */}
            <div className="mb-6">
              {isInStock() ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>
              )}
            </div>
            
            {/* Add to Cart & Buy Now Buttons */}
            <div className="flex gap-4 mb-8">
              <Button 
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                onClick={handleAddToCart}
                disabled={!isInStock()}
              >
                Add to Cart
              </Button>
              <Button 
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-brand-800"
                onClick={handleBuyNow}
                disabled={!isInStock()}
              >
                Buy Now
              </Button>
            </div>
            
            {/* Product Information Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="p-4 bg-cream-50 rounded-lg mt-2">
                <p className="text-gray-700">{product.description}</p>
              </TabsContent>
              <TabsContent value="details" className="p-4 bg-cream-50 rounded-lg mt-2">
                <pre className="text-gray-700 whitespace-pre-wrap">{product.formattedDetails}</pre>
              </TabsContent>
              <TabsContent value="nutrition" className="p-4 bg-cream-50 rounded-lg mt-2">
                <p className="text-gray-700">{product.nutritional_info || "Nutritional information not available for this product."}</p>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
