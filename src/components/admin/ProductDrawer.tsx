
import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ProductForm from './ProductForm';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';

interface ProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: string[];
  onSave: (product: Product) => Promise<void>;
  isSubmitting: boolean;
}

const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  onOpenChange,
  product,
  categories,
  onSave,
  isSubmitting
}) => {
  // Initialize the product with sensible default values if it's a new product
  const initialProduct = product?.id === 0 ? {
    ...product,
    category: product.category || (categories.length > 0 ? categories[0] : 'General'),
    stock: product.stock !== undefined ? product.stock : 100,
    price: product.price || 0,
    name: product.name || '',
    description: product.description || '',
    image_url: product.image_url || '',
    nutritional_info: product.nutritional_info || '',
    details: product.details || '',
  } : product;
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{initialProduct?.id === 0 ? 'Create New Product' : 'Edit Product'}</DrawerTitle>
          <DrawerDescription>
            {initialProduct?.id === 0
              ? 'Fill out the form below to create a new product.'
              : 'Modify the product details and save.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
          <ProductForm
            product={initialProduct}
            categories={categories}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ProductDrawer;
