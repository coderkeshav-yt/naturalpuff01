
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Loader2, Plus, Trash } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductVariant } from '@/types/product';

// Generate a unique ID for uploads
const generateUniqueId = () => {
  return uuidv4();
};

type FormErrors = Partial<Record<keyof Product, string>>;

interface ProductFormProps {
  product: Product | null;
  categories: string[];
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSave,
  onCancel,
  isSubmitting
}) => {
  const { toast } = useToast();
  const [activeProduct, setActiveProduct] = useState<Product | null>(product);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  
  // Initialize image URLs from product details if available
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    // First try to get image_urls from details field
    if (product?.details) {
      try {
        const detailsObj = typeof product.details === 'string' 
          ? JSON.parse(product.details) 
          : product.details;
        
        if (detailsObj && Array.isArray(detailsObj.image_urls) && detailsObj.image_urls.length > 0) {
          console.log('Found image URLs in details:', detailsObj.image_urls);
          return detailsObj.image_urls;
        }
      } catch (e) {
        console.error('Error parsing details for image URLs:', e);
      }
    }
    
    // Fall back to image_urls field or single image_url
    return product?.image_urls || (product?.image_url ? [product.image_url] : []);
  });
  const [variants, setVariants] = useState<ProductVariant[]>([
    { size: "50g", price: product?.price || 0 },
    { size: "100g", price: product?.price ? Math.round(product.price * 1.8) : 0 }
  ]);

  const handleProductChange = (field: keyof Product, value: string | number | boolean | string[]) => {
    setActiveProduct(prev => {
      if (!prev) return prev;
      
      const updatedProduct = { ...prev };
      
      // Handle different field types
      if (field === 'price' && (typeof value === 'string' || typeof value === 'number')) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        // Also update the variant prices based on the main price
        updateVariantPrices(numValue);
        updatedProduct.price = numValue;
      } else if (field === 'stock' && (typeof value === 'string' || typeof value === 'number')) {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        updatedProduct.stock = numValue;
      } else if (field === 'name' && typeof value === 'string') {
        updatedProduct.name = value;
      } else if (field === 'description' && typeof value === 'string') {
        updatedProduct.description = value;
      } else if (field === 'image_url' && typeof value === 'string') {
        updatedProduct.image_url = value;
      } else if (field === 'category' && typeof value === 'string') {
        updatedProduct.category = value;
      } else if (field === 'details' && typeof value === 'string') {
        updatedProduct.details = value;
      } else if (field === 'image_urls' && Array.isArray(value)) {
        (updatedProduct as any).image_urls = value;
      }
      
      return updatedProduct;
    });
  };

  const updateVariantPrices = (basePrice: number) => {
    setVariants(prev => prev.map((variant, index) => {
      // First variant uses base price, second variant is 1.8x the base price
      const price = index === 0 ? basePrice : Math.round(basePrice * 1.8);
      return { ...variant, price };
    }));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    setVariants(prev => {
      const newVariants = [...prev];
      if (field === 'price' || field === 'stock') {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        newVariants[index] = { ...newVariants[index], [field]: numValue };
      } else {
        newVariants[index] = { ...newVariants[index], [field]: value };
      }
      return newVariants;
    });
  };

  const addVariant = () => {
    const basePrice = activeProduct?.price || 0;
    setVariants(prev => [...prev, { size: "", price: basePrice }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one variant is required",
      });
      return;
    }
    
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (product: Product): FormErrors => {
    const errors: FormErrors = {};
    if (!product.name) errors.name = 'Name is required';
    if (!product.description) errors.description = 'Description is required';
    if (product.price === undefined || product.price === null || product.price < 0) errors.price = 'Price must be a non-negative number';
    if (!product.image_url) errors.image_url = 'Image URL is required';
    if (product.stock === undefined || product.stock === null || product.stock < 0) errors.stock = 'Stock must be a non-negative integer';
    if (!product.category) errors.category = 'Category is required';
    
    // Validate variants
    if (variants.length === 0) {
      errors.price = 'At least one variant is required';
    } else {
      const hasEmptySize = variants.some(v => !v.size.trim());
      if (hasEmptySize) {
        errors.price = 'All variant sizes must be filled';
      }
    }
    
    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !activeProduct) {
      toast({ title: "Error", description: "Please select an image to upload." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename for the image to avoid collisions
      const uniqueId = generateUniqueId();
      const timestamp = new Date().getTime();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `product_image_${uniqueId}_${timestamp}_${safeFileName}`;
      
      // Create a FormData object to upload the image
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', filename);
      
      // Use a mock URL for now - normally this would be uploaded to a storage service
      // Add timestamp and unique ID to ensure the URL is always unique
      const mockImageUrl = `https://picsum.photos/seed/${uniqueId}_${timestamp}/800/600`;
      
      // In a real implementation, you would upload to a storage service
      // and get back a URL. Here, we're simulating that with a timeout
      setTimeout(() => {
        // Add to image URLs array
        const updatedUrls = [...imageUrls, mockImageUrl];
        setImageUrls(updatedUrls);
        
        // Set as main image if it's the first one
        if (updatedUrls.length === 1) {
          handleProductChange('image_url', mockImageUrl);
        }
        
        // Update the image_urls field in the product
        handleProductChange('image_urls', updatedUrls);
        
        toast({ title: "Success", description: "Image uploaded successfully." });
        setIsUploading(false);
        setUploadProgress(100);
        setSelectedFile(null);
      }, 1000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image." });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast({ title: "Error", description: "Please enter a valid image URL." });
      return;
    }
    
    // Add to image URLs array
    const updatedUrls = [...imageUrls, newImageUrl];
    setImageUrls(updatedUrls);
    
    // Set as main image if it's the first one
    if (updatedUrls.length === 1) {
      handleProductChange('image_url', newImageUrl);
    }
    
    // Update the image_urls field in the product
    handleProductChange('image_urls', updatedUrls);
    
    // Also update the details field to store image URLs
    try {
      // Parse existing details
      let detailsObj = {};
      if (activeProduct?.details) {
        detailsObj = typeof activeProduct.details === 'string' 
          ? JSON.parse(activeProduct.details) 
          : activeProduct.details;
      }
      
      // Update the image_urls in details
      detailsObj.image_urls = updatedUrls;
      
      // Save back to product
      handleProductChange('details', JSON.stringify(detailsObj));
    } catch (e) {
      console.error('Error updating details with image URLs:', e);
    }
    
    setNewImageUrl('');
    toast({ title: "Success", description: "Image URL added." });
  };
  
  const handleRemoveImage = (index: number) => {
    const updatedUrls = [...imageUrls];
    updatedUrls.splice(index, 1);
    setImageUrls(updatedUrls);
    
    // Update the main image if needed
    if (updatedUrls.length > 0 && index === 0) {
      handleProductChange('image_url', updatedUrls[0]);
    } else if (updatedUrls.length === 0) {
      handleProductChange('image_url', '');
    }
    
    // Update the image_urls field in the product
    handleProductChange('image_urls', updatedUrls);
    
    // Also update the details field to store image URLs
    try {
      // Parse existing details
      let detailsObj = {};
      if (activeProduct?.details) {
        detailsObj = typeof activeProduct.details === 'string' 
          ? JSON.parse(activeProduct.details) 
          : activeProduct.details;
      }
      
      // Update the image_urls in details
      detailsObj.image_urls = updatedUrls;
      
      // Save back to product
      handleProductChange('details', JSON.stringify(detailsObj));
    } catch (e) {
      console.error('Error updating details with image URLs:', e);
    }
  };
  
  const handleSetMainImage = (index: number) => {
    if (index >= 0 && index < imageUrls.length) {
      handleProductChange('image_url', imageUrls[index]);
      
      // Also update the details field to ensure main image is preserved
      try {
        // Parse existing details
        const detailsObj: Record<string, any> = {};
        if (activeProduct?.details) {
          const parsedDetails = typeof activeProduct.details === 'string' 
            ? JSON.parse(activeProduct.details) 
            : activeProduct.details;
          
          // Copy all existing properties
          Object.assign(detailsObj, parsedDetails);
        }
        
        // Make sure image_urls array exists and contains all images
        detailsObj.image_urls = imageUrls;
        // Also store the main image index for reference
        detailsObj.main_image_index = index;
        
        // Save back to product
        handleProductChange('details', JSON.stringify(detailsObj));
      } catch (e) {
        console.error('Error updating details with main image:', e);
      }
      
      toast({ title: "Success", description: "Main image updated." });
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter a category name" 
      });
      return;
    }

    // Don't add duplicate categories
    if (categories.includes(newCategory.trim())) {
      toast({ 
        title: "Error", 
        description: "This category already exists" 
      });
      return;
    }

    // Set this new category as the selected category
    handleProductChange('category', newCategory.trim());
    setNewCategory('');

    toast({ 
      title: "Success", 
      description: "Category added and selected" 
    });
  };

  const handleSubmit = async () => {
    if (!activeProduct) return;

    const errors = validateForm(activeProduct);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Error!",
        description: "Please correct the form errors.",
      });
      return;
    }

    try {
      // Safely parse the details field
      let currentDetails = {};
      if (activeProduct.details) {
        try {
          if (typeof activeProduct.details === 'string') {
            currentDetails = JSON.parse(activeProduct.details);
          } else {
            currentDetails = activeProduct.details;
          }
        } catch (e) {
          console.error('Error parsing details:', e);
          // If parsing fails, use an empty object
          currentDetails = {};
        }
      }
      
      // Create updated details with variants
      const updatedDetails = {
        ...currentDetails,
        category: activeProduct.category,
        variants: variants
      };
      
      // Create the final product object
      const updatedProduct = {
        ...activeProduct,
        details: JSON.stringify(updatedDetails),
        image_urls: imageUrls
      };
      
      await onSave(updatedProduct);
    } catch (error: any) {
      toast({
        title: "Error!",
        description: error.message,
      });
    }
  };

  if (!activeProduct) return null;

  // Ensure we have at least one default category if categories array is empty
  const displayCategories = categories.length > 0 
    ? categories 
    : ['General'];

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          value={activeProduct?.name || ''}
          onChange={(e) => handleProductChange('name', e.target.value)}
          disabled={isSubmitting}
        />
        {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={activeProduct?.description || ''}
          onChange={(e) => handleProductChange('description', e.target.value)}
          disabled={isSubmitting}
        />
        {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Base Price</Label>
        <Input
          type="number"
          id="price"
          value={activeProduct?.price || ''}
          onChange={(e) => handleProductChange('price', parseFloat(e.target.value))}
          disabled={isSubmitting}
        />
        {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stock">Stock</Label>
          <Input
            type="number"
            id="stock"
            value={activeProduct?.stock !== undefined ? activeProduct.stock : ''}
            onChange={(e) => handleProductChange('stock', parseInt(e.target.value, 10))}
            disabled={isSubmitting}
            min="0"
          />
        <p className="text-sm text-muted-foreground">Set to 0 for out of stock products</p>
        {formErrors.stock && <p className="text-red-500 text-sm">{formErrors.stock}</p>}
      </div>
      
      {/* Variant Section */}
      <div className="grid gap-2 mt-2">
        <div className="flex justify-between items-center">
          <Label>Product Variants</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addVariant}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Size
          </Button>
        </div>
        
        {variants.map((variant, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-md">
            <div className="col-span-5">
              <Label htmlFor={`variant-size-${index}`}>Size</Label>
              <Input
                id={`variant-size-${index}`}
                value={variant.size}
                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-5">
              <Label htmlFor={`variant-price-${index}`}>Price</Label>
              <Input
                id={`variant-price-${index}`}
                type="number"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, 'price', parseInt(e.target.value, 10))}
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => removeVariant(index)}
                disabled={isSubmitting || variants.length <= 1}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="details">Product Details</Label>
        <div className="text-sm text-muted-foreground mb-2">
          This field is automatically managed. You don't need to edit it directly.
        </div>
        <Textarea
          id="details"
          value={activeProduct?.details && typeof activeProduct.details === 'string' ? 
            (() => {
              try {
                // Try to parse and prettify the JSON
                const parsed = JSON.parse(activeProduct.details);
                return JSON.stringify(parsed, null, 2);
              } catch (e) {
                // If it's not valid JSON, return as is
                return activeProduct.details;
              }
            })() : ''}
          readOnly={true}
          disabled={true}
          placeholder="Product details are automatically generated"
          className="font-mono text-sm h-32 bg-muted"
        />
        {formErrors.details && <p className="text-red-500 text-sm">{formErrors.details}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex items-center gap-2">
          <Select 
            value={activeProduct?.category || ''} 
            onValueChange={(value) => handleProductChange('category', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {displayCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="text"
            placeholder="Add new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={isSubmitting}
          />
          <Button 
            type="button"
            onClick={handleAddCategory}
            disabled={isSubmitting || !newCategory.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {formErrors.category && <p className="text-red-500 text-sm">{formErrors.category}</p>}
      </div>
      <div className="grid gap-4">
        <div>
          <Label className="text-lg font-semibold">Product Images</Label>
          <p className="text-sm text-muted-foreground mb-2">Add multiple images for your product. The first image will be used as the main image.</p>
        </div>
        
        {/* Image Preview Grid */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Product image ${index + 1}`}
                  className={`w-full h-32 object-cover rounded-md border ${url === activeProduct?.image_url ? 'border-blue-500 border-2' : ''}`}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                  }}
                />
                <div className="absolute top-1 right-1 flex space-x-1">
                  {url !== activeProduct?.image_url && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                      onClick={() => handleSetMainImage(index)}
                      title="Set as main image"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    onClick={() => handleRemoveImage(index)}
                    title="Remove image"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
                {url === activeProduct?.image_url && (
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Add Image by URL */}
        <div className="space-y-2">
          <Label htmlFor="new-image-url">Add Image URL</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              id="new-image-url"
              placeholder="https://example.com/image.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1"
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
            />
            <Button
              type="button"
              onClick={handleAddImageUrl}
              disabled={!newImageUrl.trim() || isSubmitting}
            >
              Add URL
            </Button>
          </div>
        </div>
        
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="upload-image">Or Upload Image</Label>
          <div className="flex items-center space-x-2">
            <label htmlFor="upload-image" className="flex-1">
              <Input
                type="file"
                id="upload-image"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSubmitting || isUploading}
                accept="image/*"
              />
              <Button variant="outline" className="w-full" asChild disabled={isSubmitting || isUploading}>
                <label htmlFor="upload-image" className="cursor-pointer">
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </label>
              </Button>
            </label>
            {selectedFile && (
              <Button 
                variant="secondary" 
                onClick={handleImageUpload} 
                disabled={isSubmitting || isUploading}
                className="whitespace-nowrap"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
          {isUploading && (
            <div className="space-y-1">
              <progress value={uploadProgress} max="100" className="w-full h-2">
                {uploadProgress}%
              </progress>
              <p className="text-xs text-muted-foreground text-right">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
        
        {formErrors.image_url && <p className="text-red-500 text-sm">{formErrors.image_url}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
