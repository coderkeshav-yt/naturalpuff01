
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import ProductTable from './ProductTable';
import ProductDrawer from './ProductDrawer';
import DeleteProductDialog from './DeleteProductDialog';
import RefreshDataButton from './RefreshDataButton';

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Function to fetch all products
  const fetchProducts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique categories from products
      const allCategories = new Set<string>();
      
      // Add 'General' as a default category
      allCategories.add('General');
      
      // Transform data to include category
      const productsWithCategory = data?.map(product => {
        let category = '';
        if (product.details) {
          try {
            const detailsObj = JSON.parse(product.details);
            if (detailsObj.category) {
              category = detailsObj.category;
              allCategories.add(category);
            }
          } catch {
            category = 'General';
          }
        }
        
        return {
          ...product,
          category: category || 'General'
        };
      }) || [];
      
      setProducts(productsWithCategory);
      setCategories(Array.from(allCategories));
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setFetchError(error.message || 'Failed to load products');
      toast({
        title: 'Error',
        description: error.message || 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle opening the drawer for editing or creating products
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  // Function to handle creating a new product
  const handleNewProduct = () => {
    setSelectedProduct({
      id: 0, // Use 0 to indicate a new product
      name: '',
      description: '',
      price: 0,
      stock: 100,
      image_url: '',
      category: 'General', // This is used only in the UI, not sent to DB directly
      details: JSON.stringify({ category: 'General' }),
      nutritional_info: '',
    });
    setDrawerOpen(true);
  };

  // Function to handle delete product confirmation dialog
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Function to save a product (create or update)
  const handleSaveProduct = async (product: Product) => {
    setIsSubmitting(true);
    try {
      // Auto mark as out of stock if stock is 0
      if (product.stock === 0) {
        // Parse details to add or update out_of_stock flag
        let details = {};
        if (product.details) {
          try {
            details = JSON.parse(product.details);
          } catch (e) {
            console.error('Error parsing product details:', e);
          }
        }
        // Set out_of_stock flag to true
        details = { ...details, out_of_stock: true };
        product.details = JSON.stringify(details);
      } else if (product.stock && product.stock > 0) {
        // If stock is greater than 0, ensure out_of_stock is false
        let details = {};
        if (product.details) {
          try {
            details = JSON.parse(product.details);
          } catch (e) {
            console.error('Error parsing product details:', e);
          }
        }
        // Set out_of_stock flag to false
        details = { ...details, out_of_stock: false };
        product.details = JSON.stringify(details);
      }
      
      // Skip name uniqueness check when editing stock or other fields
      // We'll only do the check if we're creating a new product or explicitly changing the name
      
      // Process the product details
      // Create a clean version of the product without the category field
      // since category is not a direct column in the products table
      const { category, ...productWithoutCategory } = product;
      let processedProduct = { ...productWithoutCategory };
      
      // Handle the details field - ensure it's valid JSON with category and variants
      try {
        // Parse existing details if available
        let detailsObj = {};
        if (product.details) {
          if (typeof product.details === 'string') {
            try {
              detailsObj = JSON.parse(product.details);
            } catch (e) {
              console.error('Failed to parse product details JSON:', e);
              detailsObj = {};
            }
          } else {
            detailsObj = product.details;
          }
        }
        
        // Store category in details JSON instead of as a direct column
        detailsObj.category = category || 'General';
        
        // Convert details back to string
        processedProduct.details = JSON.stringify(detailsObj);
      } catch (e) {
        console.error('Error processing product details:', e);
        // Fallback to simple details object
        processedProduct.details = JSON.stringify({ category: category || 'General' });
      }
      
      // Make sure we're not including any fields that don't exist in the database schema
      // Create a clean database product object without UI-only fields
      const dbProduct = {
        name: processedProduct.name,
        description: processedProduct.description,
        price: processedProduct.price,
        stock: processedProduct.stock,
        image_url: processedProduct.image_url,
        // Store image URLs in the details JSON since the image_urls column doesn't exist yet
        details: JSON.stringify({
          ...JSON.parse(processedProduct.details || '{}'),
          image_urls: processedProduct.image_urls || [processedProduct.image_url]
        }),
        nutritional_info: processedProduct.nutritional_info || '',
        // Store recommended product IDs as a JSON string
        recommended_product_ids: processedProduct.recommended_product_ids ? 
          JSON.stringify(processedProduct.recommended_product_ids) : 
          null
      };
      
      console.log('Saving product with image URLs in details:', dbProduct.details);
      
      // Creating a new product
      if (product.id === 0) {
        // Insert the new product directly - let the database handle uniqueness
        const { data, error } = await supabase
          .from('products')
          .insert(dbProduct)
          .select();

        if (error) {
          console.error('Error creating product:', error);
          // Check if it's a unique constraint violation
          if (error.message && error.message.includes('unique constraint')) {
            throw new Error('A product with this name already exists');
          }
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      } else {
        // Updating an existing product
        // Get the current product first to compare
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Only check for name uniqueness if the name has changed
        if (currentProduct && 
            product.name && 
            currentProduct.name !== product.name) {
          
          // Check if another product has this name
          const { data: existingProducts, error: checkError } = await supabase
            .from('products')
            .select('id')
            .ilike('name', product.name.trim())
            .neq('id', product.id);

          if (checkError) throw checkError;

          if (existingProducts && existingProducts.length > 0) {
            throw new Error('A product with this name already exists');
          }
        }

        // Update the product
        const { error } = await supabase
          .from('products')
          .update(dbProduct)
          .eq('id', product.id);

        if (error) {
          console.error('Error updating product:', error);
          if (error.message && error.message.includes('unique constraint')) {
            throw new Error('A product with this name already exists');
          }
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      }

      // Refresh products list and close drawer
      await fetchProducts();
      setDrawerOpen(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete a product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      // Refresh products list and close dialog
      fetchProducts();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Product Management</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchProducts} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <RefreshDataButton onRefreshComplete={fetchProducts} />
          
          <Button onClick={handleNewProduct} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : fetchError ? (
          <div className="text-center p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-red-700 mb-2">{fetchError}</p>
            <Button 
              onClick={fetchProducts}
              variant="destructive"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No products available. Add your first product to get started.</p>
          </div>
        ) : (
          <ProductTable
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
          />
        )}
      </CardContent>

      {/* Product Edit/Create Drawer */}
      <ProductDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        product={selectedProduct}
        categories={categories}
        onSave={handleSaveProduct}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onConfirm={handleDeleteProduct}
        isSubmitting={isSubmitting}
      />
    </Card>
  );
};

export default ProductManagement;
