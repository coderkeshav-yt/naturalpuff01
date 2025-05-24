
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  variant?: string;
}

export interface Coupon {
  code: string;
  discount_percent: number;
  min_order_value?: number;
  expiry_date?: string;
  is_active: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartItems: CartItem[]; // Adding alias for items for backward compatibility
  cartTotal: number; // Adding alias for totalPrice for backward compatibility
  
  // Coupon functionality
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  discountAmount: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Load cart and coupon from localStorage on initial render
  useEffect(() => {
    // Load cart items
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart data:', error);
        localStorage.removeItem('cart');
      }
    }
    
    // Load applied coupon
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (error) {
        console.error('Failed to parse coupon data:', error);
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);
  
  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      // Check if item with same id AND same variant exists
      const existingItemIndex = currentItems.findIndex(i => 
        i.id === item.id && 
        ((!i.variant && !item.variant) || i.variant === item.variant)
      );
      
      if (existingItemIndex >= 0) {
        return currentItems.map((i, index) => 
          index === existingItemIndex ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...currentItems, { ...item, quantity: 1 }];
      }
    });
  };

  const removeItem = (id: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      setItems(currentItems => 
        currentItems.map(item => 
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };
  
  // Coupon methods
  const applyCoupon = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  );
  
  // Calculate discount amount based on applied coupon
  const discountAmount = appliedCoupon && totalPrice >= (appliedCoupon.min_order_value || 0)
    ? Math.round((totalPrice * appliedCoupon.discount_percent) / 100)
    : 0;
  
  // Calculate final total after discount
  const finalTotal = Math.max(totalPrice - discountAmount, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    cartItems: items, // Alias for backward compatibility
    cartTotal: totalPrice, // Alias for backward compatibility
    
    // Coupon functionality
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    finalTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
