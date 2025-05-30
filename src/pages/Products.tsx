import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Search, Filter, Star, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useProductStatus } from '@/hooks/use-product-status';
import { RefreshDataButton } from '@/components/admin/RefreshDataButton';
import { ProductImageCarousel } from '@/components/ui/product-image-carousel';
import LazyImage from '@/components/ui/LazyImage';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  image_urls?: string[];
  details: string;
  nutritional_info: string;
  stock?: number;
  // New fields to support variants
  variants?: {
    size: string;
    price: number;
  }[];
  discount_percent?: number;
  rating?: number;
  category?: string;
}

interface ProductFilterOptions {
  sort: string;
  minPrice: number | null;
  maxPrice: number | null;
}

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptions>({
    sort: 'name-asc',
    minPrice: null,
    maxPrice: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Raw product data from database:', JSON.stringify(data, null, 2));
        
        // Transform products data
        const transformedProducts = data.map((product: any) => {
          console.log('Processing product:', product.name);
          console.log('Product details:', JSON.stringify(product.details, null, 2));
          let category = 'General';
          let image_urls: string[] = [];
          
          try {
            // Parse the details JSON if it exists
            const details = product.details ? JSON.parse(product.details) : {};
            
            // Get category from details or use default
            if (details.category) {
              category = details.category;
            }
            
            // Get image URLs - check multiple possible locations
            if (details.image_urls && Array.isArray(details.image_urls)) {
              // If image_urls exists in details
              image_urls = details.image_urls.filter((url: any) => url && typeof url === 'string');
            } else if (product.image_url) {
              // If single image_url exists on the product
              image_urls = [product.image_url];
            } else if (details.image_url) {
              // If image_url exists in details
              image_urls = [details.image_url];
            }
            
            // If we have a main_image_index, use it to reorder the images
            if (details.main_image_index !== undefined && image_urls.length > 1) {
              const mainIndex = details.main_image_index;
              if (mainIndex >= 0 && mainIndex < image_urls.length) {
                const mainImage = image_urls.splice(mainIndex, 1)[0];
                image_urls.unshift(mainImage);
              }
            }
            
            console.log(`Processed product ${product.name}:`, { 
              imageCount: image_urls.length,
              hasMainImage: details.main_image_index !== undefined,
              originalImage: product.image_url 
            });
            
          } catch (e) {
            console.error('Error processing product:', product.name, e);
          }
          
          // Add variants to all products
          const transformedProduct = {
            ...product,
            category,
            image_urls, // Include extracted image_urls
            variants: [
              { size: "50g", price: product.price },
              { size: "100g", price: Math.round(product.price * 1.8) },
            ],
            rating: 4.5 + Math.random() * 0.5,
            discount_percent: Math.floor(Math.random() * 10) + 5,
          };
          
          console.log('Transformed product:', JSON.stringify({
            name: transformedProduct.name,
            image_url: transformedProduct.image_url,
            image_urls: transformedProduct.image_urls,
            details: transformedProduct.details
          }, null, 2));
          
          return transformedProduct;
        });
        
        console.log('Fetched products:', transformedProducts);
        setProducts(transformedProducts as Product[]);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0); // Reset image index when opening a new product
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0].size);
    }
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setSelectedVariant('');
  };

  const getProductPrice = (product: Product) => {
    if (product.variants && product.variants.length > 0 && selectedVariant) {
      const variant = product.variants.find(v => v.size === selectedVariant);
      return variant ? variant.price : product.price;
    }
    return product.price;
  };

  const handleAddToCart = (product: Product) => {
    // Check if product is out of stock
    const status = useProductStatus(product);
    if (status.isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable",
        variant: "destructive"
      });
      return;
    }

    const productPrice = getProductPrice(product);
    const productName = product.variants && selectedVariant
      ? `${product.name} (${selectedVariant})`
      : product.name;
      
    addItem({
      id: product.id,
      name: productName,
      price: productPrice,
      image_url: product.image_url || '/placeholder.svg',
      variant: selectedVariant || undefined,
    });
    
    toast({
      title: "Added to Cart",
      description: `${productName} has been added to your cart.`,
    });
    
    closeProductDetails();
  };

  const handleBuyNow = (product: Product) => {
    // Check if product is out of stock
    const status = useProductStatus(product);
    if (status.isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to make a purchase",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    const productPrice = getProductPrice(product);
    const productName = product.variants && selectedVariant
      ? `${product.name} (${selectedVariant})`
      : product.name;
      
    // Add to cart and immediately go to checkout
    addItem({
      id: product.id,
      name: productName,
      price: productPrice,
      image_url: product.image_url || '/placeholder.svg',
      variant: selectedVariant || undefined,
    });
    
    navigate('/checkout');
  };
  
  // Filter products based on search and filter options
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(product => {
      if (filterOptions.minPrice !== null && getProductPrice(product) < filterOptions.minPrice) {
        return false;
      }
      if (filterOptions.maxPrice !== null && getProductPrice(product) > filterOptions.maxPrice) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filterOptions.sort) {
        case 'price-asc':
          return getProductPrice(a) - getProductPrice(b);
        case 'price-desc':
          return getProductPrice(b) - getProductPrice(a);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-gold-500 text-gold-500" />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="w-4 h-4 absolute text-gold-500" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gold-300" />);
    }

    return (
      <div className="flex">
        {stars}
        <span className="ml-1 text-sm text-brand-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderProductStock = (product: Product) => {
    const status = useProductStatus(product);
    
    return (
      <div className={`mt-2 ${status.statusClass}`}>
        <Badge className={status.badgeClass}>
          {status.statusText}
        </Badge>
      </div>
    );
  };

  const ProductActions = ({ product }: { product: Product }) => {
    const status = useProductStatus(product);
    
    if (status.isOutOfStock) {
      return (
        <div className="flex space-x-2">
          <Button 
            className="bg-brand-600 hover:bg-brand-700 text-white flex-1"
            onClick={() => openProductDetails(product)}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            disabled
            className="border-gray-300 text-gray-400 cursor-not-allowed"
          >
            Out of Stock
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex space-x-2">
        <Button 
          className="bg-brand-600 hover:bg-brand-700 text-white flex-1"
          onClick={() => openProductDetails(product)}
        >
          View Details
        </Button>
        <Button
          variant="outline"
          className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white"
          onClick={() => handleAddToCart(product)}
        >
          Add to Cart
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="section-padding flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-700 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-cream-100 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 bg-pattern"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container-custom relative z-10"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-brand-800 font-playfair">Our Premium Products</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-brand-700">
              Discover our range of premium makhana snacks, handcrafted with care using the finest ingredients.
              Each flavor is designed to deliver a perfect balance of taste and nutrition.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Products Grid */}
      <section className="section-padding bg-cream-200">
        <div className="container-custom">
          {/* Search and Filter Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/2 relative">
              <Input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-600" />
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-brand-600 text-brand-600">
                    <Filter className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuRadioGroup 
                    value={filterOptions.sort} 
                    onValueChange={(value) => setFilterOptions({ ...filterOptions, sort: value })}
                  >
                    <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-asc">Price (Low to High)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-desc">Price (High to Low)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                className="border-brand-600 text-brand-600"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <RefreshDataButton onRefreshComplete={fetchProducts} />
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-cream-100 p-4 rounded-lg mb-8"
            >
              <h3 className="text-lg font-bold mb-4">Filter by Price</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-price">Min Price</Label>
                  <Input
                    id="min-price"
                    type="number"
                    placeholder="₹0"
                    value={filterOptions.minPrice || ''}
                    onChange={(e) => setFilterOptions({
                      ...filterOptions,
                      minPrice: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="max-price">Max Price</Label>
                  <Input
                    id="max-price"
                    type="number"
                    placeholder="₹1000"
                    value={filterOptions.maxPrice || ''}
                    onChange={(e) => setFilterOptions({
                      ...filterOptions,
                      maxPrice: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setFilterOptions({
                    sort: 'name-asc',
                    minPrice: null,
                    maxPrice: null,
                  })}
                >
                  Reset
                </Button>
                <Button 
                  className="bg-brand-600" 
                  onClick={() => setShowFilters(false)}
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="h-64 overflow-hidden relative group">
                    {/* Product image carousel */}
                    <ProductImageCarousel 
                      key={`${product.id}-${Date.now()}`}
                      images={(() => {
                        // Debug log the raw product data
                        console.log('Product data:', {
                          id: product.id,
                          name: product.name,
                          image_url: product.image_url,
                          image_urls: product.image_urls,
                          details: product.details
                        });
                        
                        // Extract images from the product data
                        const extractImages = (data: any): string[] => {
                          if (!data) return [];
                          
                          // If data is a string, try to parse it as JSON
                          if (typeof data === 'string') {
                            try {
                              data = JSON.parse(data);
                            } catch (e) {
                              console.error('Failed to parse data as JSON:', e);
                              return [];
                            }
                          }
                          
                          // If data is an array, return it directly
                          if (Array.isArray(data)) {
                            return data.filter((url: any) => 
                              url && typeof url === 'string' && url.trim() !== ''
                            );
                          }
                          
                          // If data is an object, look for image arrays in common properties
                          if (typeof data === 'object' && data !== null) {
                            // Check for direct image properties first
                            if (data.image_url) {
                              return [data.image_url];
                            }
                            
                            // Check for array properties that might contain images
                            const possibleImageArrays = [
                              data.image_urls,
                              data.images,
                              data.imageURLs,
                              data.Images,
                              data.imageUrls
                            ];
                            
                            for (const arr of possibleImageArrays) {
                              if (Array.isArray(arr) && arr.length > 0) {
                                const validUrls = arr.filter((url: any) => 
                                  url && typeof url === 'string' && url.trim() !== ''
                                );
                                if (validUrls.length > 0) {
                                  return validUrls;
                                }
                              }
                            }
                          }
                          
                          return [];
                        };
                        
                        // Try different sources for images
                        let images: string[] = [];
                        
                        // 1. Check image_urls array
                        if (product.image_urls) {
                          images = extractImages(product.image_urls);
                        }
                        
                        // 2. Check single image_url
                        if (images.length === 0 && product.image_url) {
                          images = [product.image_url];
                        }
                        
                        // 3. Check details object
                        if (images.length === 0 && product.details) {
                          images = extractImages(product.details);
                        }
                        
                        // 4. If still no images, use a placeholder
                        if (images.length === 0) {
                          console.warn(`No valid images found for product: ${product.name}`);
                          images = ['/placeholder-product.png'];
                        } else {
                          console.log(`Found ${images.length} images for product: ${product.name}`, images);
                        }
                        
                        return images;
                      })()}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Discount badge */}
                    {product.discount_percent && (
                      <div className="absolute top-2 left-2 bg-gold-500 text-brand-800 font-bold px-2 py-1 rounded-full text-xs shadow-md">
                        {product.discount_percent}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold font-playfair">{product.name}</h3>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-bold text-brand-600">
                          ₹{product.variants ? product.variants[0].price : product.price}
                          {product.variants && <span className="text-xs ml-1">- ₹{product.variants[1].price}</span>}
                        </div>
                        {product.discount_percent && (
                          <div className="text-xs text-green-600 font-medium">
                            {product.discount_percent}% off
                          </div>
                        )}
                      </div>
                    </div>
                    {renderProductStock(product)}
                    {product.rating && (
                      <div className="mb-2">
                        {renderStarRating(product.rating)}
                      </div>
                    )}
                    <p className="text-brand-700 mb-4 line-clamp-3">{product.description}</p>
                    <ProductActions product={product} />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-brand-700">No products matching your search.</p>
              </div>
            )}
          </div>

          {/* Product Detail Dialog - Updated to show stock status and disable buttons */}
          {isMobile ? (
            <Drawer open={!!selectedProduct} onOpenChange={closeProductDetails}>
              <DrawerContent className="p-0 max-h-[95vh] overflow-y-auto">
                {selectedProduct && (
                  <>
                    <div className="bg-brand-600 text-white py-3 px-4 relative">
                      <DrawerTitle className="text-xl font-playfair text-white">{selectedProduct.name}</DrawerTitle>
                      <DrawerDescription className="text-cream-100 opacity-90 text-sm">
                        Premium Roasted Makhana | Natural Goodness
                      </DrawerDescription>
                      <DrawerClose className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 opacity-100 hover:bg-white/30 transition-colors duration-200 z-10">
                        <X className="h-4 w-4 text-white" />
                        <span className="sr-only">Close</span>
                      </DrawerClose>
                    </div>
                    
                    <div className="relative">
                      <ProductImageCarousel 
                        images={selectedProduct.image_urls || [selectedProduct.image_url]} 
                        alt={selectedProduct.name}
                        className="w-full aspect-square"
                      />
                      {selectedProduct.discount_percent && (
                        <div className="absolute top-3 left-3 bg-gold-500 text-brand-800 font-bold px-3 py-1 rounded-full text-xs shadow-md">
                          {selectedProduct.discount_percent}% OFF
                        </div>
                      )}
                      {selectedProduct.rating && (
                        <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-lg shadow-md">
                          {renderStarRating(selectedProduct.rating)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center py-2 px-3">
                      <div className="text-xl font-bold text-brand-800">
                        ₹{getProductPrice(selectedProduct)}
                      </div>
                      {renderProductStock(selectedProduct)}
                    </div>
                    
                    <div className="bg-green-50 pb-16">
                      {/* Tab buttons styled like the screenshot */}
                      <div className="flex px-3 py-2 space-x-2">
                        <Button 
                          variant="outline"
                          className="flex-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 text-xs py-1.5 h-auto rounded-full"
                          onClick={() => document.getElementById('mobile-size-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          Size Options
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 text-xs py-1.5 h-auto rounded-full"
                          onClick={() => document.getElementById('mobile-nutrition-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          Nutrition Info
                        </Button>
                      </div>
                      
                      {/* Size Options Section */}
                      <div id="mobile-size-section" className="px-3 py-2">
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <RadioGroup 
                            value={selectedVariant} 
                            onValueChange={setSelectedVariant}
                            className="flex flex-wrap gap-2"
                          >
                            {selectedProduct.variants.map((variant) => (
                              <div key={variant.size} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                <RadioGroupItem value={variant.size} id={`mobile-size-${variant.size}`} className="text-brand-600" />
                                <Label htmlFor={`mobile-size-${variant.size}`} className="cursor-pointer text-sm">
                                  {variant.size} - ₹{variant.price}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      </div>
                      

                      <div id="mobile-nutrition-section" className="px-3 py-2">
                        <div className="bg-white p-2 rounded-md border border-gray-200">
                          <p className="text-gray-700 text-sm">{selectedProduct.nutritional_info || 'High in protein, low in calories. Perfect healthy snack alternative.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Fixed at bottom of screen */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 grid grid-cols-2 gap-3 z-50">
                      {(() => {
                        const status = useProductStatus(selectedProduct);
                        if (status.isOutOfStock) {
                          return (
                            <Button 
                              className="col-span-2 bg-gray-300 text-gray-600 cursor-not-allowed py-2 rounded-md"
                              disabled
                            >
                              Out of Stock
                            </Button>
                          );
                        } else {
                          return (
                            <>
                              <Button 
                                className="bg-gold-500 hover:bg-gold-600 text-brand-800 py-2 rounded-md font-bold"
                                onClick={() => handleBuyNow(selectedProduct)}
                              >
                                Buy Now
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border border-green-700 text-green-700 hover:bg-green-50 py-2 rounded-md font-medium"
                                onClick={() => handleAddToCart(selectedProduct)}
                              >
                                Add to Cart
                              </Button>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </>
                )}
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={!!selectedProduct} onOpenChange={closeProductDetails}>
              <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-cream-50 border-0">
                {selectedProduct && (
                  <>
                    <div className="bg-brand-600 text-white py-4 px-6">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-playfair text-white">{selectedProduct.name}</DialogTitle>
                        <DialogDescription className="text-cream-100 opacity-90">
                          Premium Roasted Makhana | Natural Goodness
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    <DialogClose className="absolute right-4 top-4 rounded-full bg-white/20 p-2 opacity-100 hover:bg-white/30 transition-colors duration-200 z-10">
                      <X className="h-5 w-5 text-white" />
                      <span className="sr-only">Close</span>
                    </DialogClose>
                    <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                      <div className="relative h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-[1]"></div>
                        
                        {/* Custom Carousel Implementation */}
                        <div className="relative w-full h-full">
                          {/* Main Image */}
                          {(() => {
                            // Get image URLs from product
                            const imageUrls = selectedProduct.image_urls || [selectedProduct.image_url];
                            const currentImage = imageUrls[currentImageIndex] || selectedProduct.image_url;
                            
                            return (
                              <LazyImage 
                                src={currentImage} 
                                alt={`${selectedProduct.name} - image ${currentImageIndex + 1}`}
                                className="w-full h-full"
                                placeholderSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlOWVjZWYiLz48L3N2Zz4="
                                onLoad={() => console.log(`Loaded product detail image: ${currentImage}`)}
                              />
                            );
                          })()}
                          
                          {/* Navigation Controls */}
                          {(() => {
                            const imageUrls = selectedProduct.image_urls || [selectedProduct.image_url];
                            if (imageUrls.length > 1) {
                              return (
                                <>
                                  {/* Previous Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 p-2 shadow-md z-10"
                                    onClick={() => {
                                      const imageUrls = selectedProduct.image_urls || [selectedProduct.image_url];
                                      setCurrentImageIndex(prev => 
                                        prev === 0 ? imageUrls.length - 1 : prev - 1
                                      );
                                    }}
                                  >
                                    <ChevronLeft className="h-6 w-6 text-brand-800" />
                                    <span className="sr-only">Previous image</span>
                                  </Button>
                                  
                                  {/* Next Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 p-2 shadow-md z-10"
                                    onClick={() => {
                                      const imageUrls = selectedProduct.image_urls || [selectedProduct.image_url];
                                      setCurrentImageIndex(prev => 
                                        prev === imageUrls.length - 1 ? 0 : prev + 1
                                      );
                                    }}
                                  >
                                    <ChevronRight className="h-6 w-6 text-brand-800" />
                                    <span className="sr-only">Next image</span>
                                  </Button>
                                  
                                  {/* Indicators */}
                                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                                    {imageUrls.map((_, index) => (
                                      <button
                                        key={index}
                                        className={`h-2 rounded-full transition-all ${
                                          index === currentImageIndex 
                                            ? 'w-8 bg-white' 
                                            : 'w-2 bg-white/60 hover:bg-white/80'
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                        aria-label={`Go to image ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        
                        {selectedProduct.discount_percent && (
                          <div className="absolute top-4 left-4 bg-gold-500 text-brand-800 font-bold px-4 py-2 rounded-full text-sm shadow-md z-[2]">
                            {selectedProduct.discount_percent}% OFF
                          </div>
                        )}
                        {selectedProduct.rating && (
                          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md z-[2]">
                            {renderStarRating(selectedProduct.rating)}
                          </div>
                        )}
                      </div>
                      <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-5">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-brand-700 leading-relaxed">{selectedProduct.description}</p>
                          </div>
                          <div className="text-2xl font-bold text-brand-600 bg-cream-100 px-4 py-2 rounded-lg shadow-sm">
                            ₹{getProductPrice(selectedProduct)}
                          </div>
                        </div>
                        
                        {/* Stock Status */}
                        <div className="mb-5">
                          {renderProductStock(selectedProduct)}
                        </div>
                        
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-cream-200">
                            <h4 className="font-semibold text-lg mb-3 text-brand-800">Choose Size</h4>
                            <RadioGroup 
                              value={selectedVariant} 
                              onValueChange={setSelectedVariant}
                              className="grid grid-cols-2 gap-3"
                            >
                              {selectedProduct.variants.map((variant) => (
                                <div key={variant.size} className="flex items-center space-x-2 bg-cream-50 px-4 py-3 rounded-lg border border-cream-100 hover:border-brand-300 transition-colors duration-200">
                                  <RadioGroupItem value={variant.size} id={`size-${variant.size}`} className="text-brand-600" />
                                  <Label htmlFor={`size-${variant.size}`} className="cursor-pointer font-medium">
                                    {variant.size} - ₹{variant.price}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-5 mb-6">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200">
                            <h4 className="font-semibold text-lg mb-2 text-brand-800 flex items-center">
                              <span className="inline-block w-3 h-3 bg-gold-500 rounded-full mr-2"></span>
                              Nutritional Information
                            </h4>
                            <div className="pl-5 border-l-2 border-cream-200 mt-3">
                              <p className="text-brand-700 text-sm leading-relaxed">{selectedProduct.nutritional_info || 'High in protein, low in calories. Perfect healthy snack alternative.'}</p>
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const status = useProductStatus(selectedProduct);
                          if (status.isOutOfStock) {
                            return (
                              <div className="mt-6">
                                <Button 
                                  className="w-full bg-gray-300 text-gray-600 cursor-not-allowed py-6 rounded-xl shadow-sm"
                                  disabled
                                >
                                  Out of Stock
                                </Button>
                                <p className="text-red-600 text-sm text-center mt-2 bg-red-50 p-2 rounded-lg">This product is currently unavailable</p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-6 grid grid-cols-2 gap-4">
                                <Button 
                                  className="w-full bg-gold-500 hover:bg-gold-600 text-brand-800 py-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
                                  onClick={() => handleBuyNow(selectedProduct)}
                                >
                                  Buy Now
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="w-full border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white py-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
                                  onClick={() => handleAddToCart(selectedProduct)}
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>

      {/* Product Info */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-8 text-center font-playfair"
            >
              Why Choose Natural Puff
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-cream-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-4 font-playfair">Quality Ingredients</h3>
                <p className="text-brand-700">
                  We source only the highest grade makhana and pair them with premium ingredients. 
                  No artificial colors, flavors, or preservatives - ever.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-cream-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-4 font-playfair">Nutritional Benefits</h3>
                <p className="text-brand-700">
                  Each serving is packed with protein, fiber, and essential nutrients. 
                  Our makhana snacks are naturally gluten-free and low in calories.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-cream-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-4 font-playfair">Artisanal Roasting</h3>
                <p className="text-brand-700">
                  Our special roasting process ensures perfect texture and flavor development 
                  while preserving nutritional benefits.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-cream-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-4 font-playfair">Sustainable Packaging</h3>
                <p className="text-brand-700">
                  We're committed to minimizing our environmental impact with 
                  eco-friendly packaging materials that keep your snacks fresh.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream-100">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-8 text-center font-playfair"
            >
              Customer Favorites
            </motion.h2>
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-600 text-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-8 text-center font-playfair text-gold-500"
            >
              Join Our Newsletter
            </motion.h2>
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-600 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold mb-8 text-center font-playfair"
            >
              Looking for Wholesale Opportunities?
            </motion.h2>
            <p className="text-lg mb-8">
              We offer special pricing for bulk orders and retail partnerships. 
              Get in touch with our team to discuss how we can work together.
            </p>
            <Button className="bg-gold-500 hover:bg-gold-600 text-brand-800 px-8 py-6 text-lg">
              Contact Sales Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;
