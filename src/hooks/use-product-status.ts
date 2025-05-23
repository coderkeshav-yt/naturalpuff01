
import { Product } from '@/types/product';

export function useProductStatus(product: Product) {
  // Handle null, undefined, or explicitly set 0 stock (all should be considered out of stock)
  const isOutOfStock = product.stock === 0 || product.stock === null || product.stock === undefined;
  
  // Low stock if stock is between 1 and 10 (inclusive)
  const isLowStock = !isOutOfStock && product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 10;
  
  // Set stock level enum value for consistent reference
  const stockLevel = isOutOfStock 
    ? 'out_of_stock' 
    : isLowStock 
      ? 'low_stock' 
      : 'in_stock';

  return {
    isOutOfStock,
    isLowStock,
    stockLevel,
    stockCount: product.stock ?? 0, // Use nullish coalescing
    
    // Text to display for the product status
    statusText: isOutOfStock 
      ? 'Out of Stock'
      : isLowStock
        ? `Low Stock (${product.stock})`
        : 'In Stock',
    
    // Add color classes for easy styling
    statusClass: isOutOfStock
      ? 'text-red-600 font-semibold'
      : isLowStock
        ? 'text-amber-500 font-semibold'
        : 'text-green-600',
    
    // Add badge classes for displaying in badge format
    badgeClass: isOutOfStock
      ? 'bg-red-100 text-red-800 border border-red-200'
      : isLowStock
        ? 'bg-amber-100 text-amber-800 border border-amber-200'
        : 'bg-green-100 text-green-800 border border-green-200',

    // Availability for customer-facing display
    availability: {
      available: !isOutOfStock,
      message: isOutOfStock 
        ? 'Currently out of stock'
        : isLowStock
          ? `Hurry! Only ${product.stock} left`
          : 'Available'
    }
  };
}
