import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash, Tag, Loader2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerInfo, Coupon } from '@/types/product';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ShiprocketServiceabilityChecker from '@/components/checkout/ShiprocketServiceability';
import { processPayment } from '@/services/razorpayService';
import DirectUpiHandler from '@/components/DirectUpiHandler';
import { loadScript } from '@/lib/utils';
import OrderPolicyError from '@/components/layout/OrderPolicyError';
import DirectPermissionFix from '@/components/admin/DirectPermissionFix';

const Checkout = () => {
  const { items, totalPrice, clearCart, updateQuantity, removeItem, applyCoupon, removeCoupon, appliedCoupon, discountAmount, finalTotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [showRLSError, setShowRLSError] = useState(false);
  
  // Payment and shipping state
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [pincode, setPincode] = useState('');
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [courierOptions, setCourierOptions] = useState<{courier_code: string; courier_name: string}[]>([]);
  
  // UPI payment state
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  
  // Calculate cart totals
  const subtotal = totalPrice;

  // Function to refresh product prices from the database
  const refreshProductPrices = async () => {
    if (items.length === 0) return;
    
    try {
      // Get all product IDs from cart
      const productIds = items.map(item => item.id);
      
      // Fetch latest prices from database
      const { data: products, error } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds);
      
      if (error) {
        console.error('Error fetching updated product prices:', error);
        return;
      }
      
      if (!products || products.length === 0) return;
      
      // Create a map of product ID to latest price
      const priceMap = products.reduce((map, product) => {
        map[product.id] = product.price;
        return map;
      }, {} as Record<number, number>);
      
      // Check if any prices have changed
      const hasChanges = items.some(item => {
        const latestPrice = priceMap[item.id];
        return latestPrice !== undefined && latestPrice !== item.price;
      });
      
      if (hasChanges) {
        // Update cart items with latest prices
        items.forEach(item => {
          const latestPrice = priceMap[item.id];
          if (latestPrice !== undefined && latestPrice !== item.price) {
            console.log(`Updating price for ${item.name} from ${item.price} to ${latestPrice}`);
            updateQuantity(item.id, item.quantity, latestPrice);
          }
        });
        
        toast({
          title: "Prices Updated",
          description: "Some product prices have been updated to reflect the latest changes.",
        });
      }
    } catch (error) {
      console.error('Error refreshing product prices:', error);
    }
  };

  // Check if cart is empty and redirect if needed
  useEffect(() => {
    // Save checkout state to session storage
    if (items.length > 0) {
      sessionStorage.setItem('checkoutItems', JSON.stringify(items));
    } else {
      // If cart is empty, try to restore from session storage
      const savedItems = sessionStorage.getItem('checkoutItems');
      if (!savedItems || savedItems === '[]') {
        // No saved items, redirect to products page
        navigate('/products');
        toast({
          title: "Cart Empty",
          description: "Your cart is empty. Please add items before checkout."
        });
      }
    }
    
    // Ensure page scrolls to top when checkout component mounts
    window.scrollTo(0, 0);
  }, [items, navigate]);

  // Initialize Razorpay on component mount
  useEffect(() => {
    const loadRazorpay = async () => {
      const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      setIsRazorpayReady(loaded);
      if (!loaded) {
        toast({
          title: "Warning",
          description: "Failed to load Razorpay. Online payment may not work.",
          variant: "destructive"
        });
      }
    };

    loadRazorpay();
  }, []);
  
  // Refresh product prices when the checkout page loads
  useEffect(() => {
    refreshProductPrices();
  }, []);

  // Handle quantity change
  const handleQuantityChange = (id: number, change: number) => {
    const item = items.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(id, newQuantity);
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code.",
        variant: "destructive"
      });
      return;
    }

    setIsCouponLoading(true);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim())
        .eq('is_active', true)
        .single();

      if (error) {
        toast({
          title: "Invalid Coupon",
          description: "The coupon code you entered is invalid or has expired.",
          variant: "destructive"
        });
        setIsCouponLoading(false);
        return;
      }

      if (!data) {
        toast({
          title: "Invalid Coupon",
          description: "The coupon code you entered is invalid or has expired.",
          variant: "destructive"
        });
        setIsCouponLoading(false);
        return;
      }

      // Check if coupon is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Expired Coupon",
          description: "This coupon has expired.",
          variant: "destructive"
        });
        setIsCouponLoading(false);
        return;
      }

      // Convert database coupon to CartContext coupon format
      const cartCoupon = {
        code: data.code,
        discount_percent: data.discount_percent,
        expiry_date: data.expires_at,
        is_active: data.is_active,
        min_order_value: 0 // Default value if not present in database
      };

      // Apply the coupon using CartContext
      applyCoupon(cartCoupon);
      
      toast({
        title: "Coupon Applied",
        description: `You got ${data.discount_percent}% off!`,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order."
    });
  };

  // Handle form submission
  const handleFormSubmit = (formData: CustomerInfo) => {
    setCustomerInfo(formData);
    
    toast({
      title: "Coupon Applied",
      description: `You got ${data.discount_percent}% off!`,
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    toast({
      title: "Error",
      description: "Failed to apply coupon. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsCouponLoading(false);
  }
};

// Remove coupon
const handleRemoveCoupon = () => {
  removeCoupon();
  setCouponCode('');
  toast({
    title: "Coupon Removed",
    description: "The coupon has been removed from your order."
  });
};

// Handle form submission
const handleFormSubmit = (formData: CustomerInfo) => {
  setCustomerInfo(formData);
  setPincode(formData.pincode);
  setCheckoutStep(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Handle UPI direct payment
const handleUpiDirectPayment = async () => {
  setIsProcessing(true);

  try {
    if (!customerInfo) {
      toast({
        title: 'Error',
        description: 'Please enter your information first',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return false;
    }

    // Create order in database
    const orderId = await createOrder(finalTotal + shippingCost);

    if (!orderId) {
      setIsProcessing(false);
      return false;
    }

    // Update order with payment method
    
    // Set UPI ID based on selected option
    let upiId = 'naturalpuff@ybl'; // Replace with your actual UPI ID
    
    // Format amount to 2 decimal places
    const formattedAmount = totalWithShipping.toFixed(2);
    
    // Generate transaction reference
    const txnRef = `order_${orderId}_${Date.now()}`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Payment for order #${orderId}`)}&tr=${encodeURIComponent(txnRef)}`;
    
    console.log(`Opening ${upiApp} payment with URL:`, upiUrl);
    
    // Store order info in localStorage for verification after return
    localStorage.setItem('np_current_payment', JSON.stringify({
      orderId,
      amount: formattedAmount,
      txnRef,
      timestamp: Date.now(),
      paymentApp: upiApp
    }));
    
    // Update order with payment attempt info
    await supabase
      .from('orders')
      .update({
        payment_method: 'upi_direct',
        payment_status: 'initiated',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    // Open the UPI URL
    window.location.href = upiUrl;
    
  } catch (error: any) {
    console.error('Error initiating UPI payment:', error);
    handlePaymentFailure(orderId, error.message || 'Failed to initiate UPI payment');
  }
};

// Handle Razorpay payment
const handleRazorpayPayment = async (orderId: string) => {
  if (!customerInfo) {
    toast({
      title: "Error",
      description: "Customer information is missing.",
      variant: "destructive"
    });
    return;
  }
  
  try {
    console.log('Processing payment for order:', orderId);
    console.log('Total with shipping:', finalTotal + shippingCost);
    
    // Calculate total with shipping for payment
    const totalWithShipping = finalTotal + shippingCost;
    
    // Process payment
    await processPayment(
      totalWithShipping, // Include shipping cost in payment amount
      orderId,
      {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      handlePaymentSuccess,
      (error) => handlePaymentFailure(orderId, error.message || 'Payment failed')
    );
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
    orderId: string
  ) => {
    console.log('Processing payment success:', { 
      paymentId: response.razorpay_payment_id,
      orderId: orderId 
    });
    
    setIsProcessing(true);
    
    try {
      // Validate response parameters
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw new Error('Invalid payment response: Missing required fields');
      }
      
      if (!orderId) {
        throw new Error('Invalid order ID');
      }
      
      // Verify payment with Razorpay via Supabase Edge Function
      console.log('Verifying payment with Razorpay...');
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verifyRazorpayPayment', {
        body: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        }
      });
      
      if (verificationError) {
        console.error('Payment verification error:', verificationError);
        throw new Error(`Payment verification failed: ${verificationError.message || 'Unknown error'}`);
      }
      
      if (!verificationData || verificationData.status !== 'success') {
        console.error('Payment verification failed:', verificationData);
        throw new Error('Payment verification failed: Invalid signature');
      }
      
      console.log('Payment verified successfully, updating order status...');
      
      // Update order status with payment details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            payment_status: 'paid',
            payment_date: new Date().toISOString(),
            verified: true
          })
        })
        .eq('id', orderId)
        .select();

      if (orderError) {
        console.error('Payment success update error:', orderError);
        throw new Error(`Failed to update order: ${orderError.message}`);
      }
      
      if (!orderData || orderData.length === 0) {
        throw new Error('Order not found or could not be updated');
      }

      console.log('Order updated successfully:', orderData[0].id);
      
      // Show success message
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully. Thank you for your order!",
      });

      // Clear cart and redirect to success page
      clearCart();
      navigate(`/order-success?id=${orderId}`);
    } catch (error: any) {
      console.error('Payment success handling error:', error);
      
      // Show error message
      toast({
        title: "Payment Processing Error",
        description: error.message || "There was a problem processing your payment confirmation.",
        variant: "destructive"
      });
      
      // Redirect to order page with error flag
      if (orderId) {
        navigate(`/order-success?id=${orderId}&payment=failed`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to handle payment failures consistently
  const handlePaymentFailure = (orderId: string, errorMessage: string) => {
    // Log the error
    console.error(`Payment failure for order ${orderId}: ${errorMessage}`);
    
    // Update the order status
    updateOrderPaymentStatus(orderId, 'payment_failed');
    
    // Show error toast
    toast({
      title: "Payment Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    // Redirect to order success page with payment=failed parameter
    navigate(`/order-success?id=${orderId}&payment=failed`);
  };

  // Helper function to update order payment status with improved retry logic
  const updateOrderPaymentStatus = async (orderId: string, status: string) => {
    try {
      console.log(`Updating order ${orderId} payment status to ${status}`);
      
      // Try up to 5 times to update the order status with exponential backoff
      let attempts = 0;
      let success = false;
      
      while (attempts < 5 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to update order status`);
        
        try {
          // First check if we have permission to update this order
          const { data: checkData, error: checkError } = await supabase
            .from('orders')
            .select('id, payment_status')
            .eq('id', orderId)
            .single();
          
          if (checkError) {
            console.error(`Error checking order (attempt ${attempts}):`, checkError);
            throw checkError;
          }
          
          if (!checkData) {
            console.error(`Order ${orderId} not found`);
            throw new Error(`Order ${orderId} not found`);
          }
          
          // Now update the order
          const { error } = await supabase
            .from('orders')
            .update({ 
              payment_status: status,
              updated_at: new Date().toISOString() 
            })
            .eq('id', orderId);
          
          if (error) {
            console.error(`Error updating order status (attempt ${attempts}):`, error);
            throw error;
          }
          
          console.log(`Successfully updated order ${orderId} status to ${status}`);
          success = true;
          
        } catch (updateError) {
          // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 16000);
          console.log(`Retrying after ${delay}ms delay...`);
          
          if (attempts < 5) {
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      
      // If still not successful after all retries, try to fix permissions
      if (!success) {
        console.log('Attempting to fix database permissions before final try...');
        
        try {
          // Call the fixOrderPermissions function
          const { error: fixError } = await supabase.functions.invoke('fixOrderPermissions');
          if (fixError) {
            console.error('Error fixing permissions:', fixError);
          } else {
            console.log('Permissions fixed, trying one more update...');
            
            // One final attempt after fixing permissions
            const { error: finalError } = await supabase
              .from('orders')
              .update({ 
                payment_status: status,
                updated_at: new Date().toISOString() 
              })
              .eq('id', orderId);
            
            if (!finalError) {
              console.log(`Finally updated order ${orderId} status to ${status}`);
              success = true;
            } else {
              console.error('Final update attempt failed:', finalError);
            }
          }
        } catch (fixAttemptError) {
          console.error('Error during permission fix attempt:', fixAttemptError);
        }
      }
      
      if (!success) {
        toast({
          title: "Database Error",
          description: "Failed to update order status. Your order is saved but may show incorrect status.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating order payment status:', error);
      toast({
        title: "System Error",
        description: "An unexpected error occurred while updating your order.",
        variant: "destructive"
      });
    }
  };

  // Fix database permissions
  const fixDatabasePermissions = async () => {
    try {
      console.log('Attempting to fix database permissions...');
      const { data, error } = await supabase.functions.invoke('fixOrderPermissions');
      
      if (error) {
        console.error('Error fixing database permissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fix database permissions. Please try again later.',
          variant: 'destructive'
        });
        return false;
      }
      
      console.log('Database permissions fixed:', data);
      toast({
        title: 'Success',
        description: 'Database permissions fixed successfully.',
      });
      
      setShowRLSError(false);
      return true;
    } catch (error) {
      console.error('Error fixing database permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix database permissions. Please try again later.',
        variant: 'destructive'
      });
      return false;
  
  try {
    // Validate customer information
    if (!customerInfo) {
      toast({
        title: 'Error',
        description: 'Please enter your information first',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }
    
    // Validate shipping cost
    if (selectedCourier === '' || shippingCost <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a shipping method',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }
    
    // Create order in database
    const orderItems = items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image_url: item.image_url
    }));
    
    // Prepare the order data with only essential fields that are definitely in the database schema
    const orderData = {
      // Basic order information
      status: 'pending',
      total_amount: finalTotal,
      user_id: user?.id || null,
      
      // Store customer and shipping info as JSON
      shipping_address: JSON.stringify({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        pincode: customerInfo.pincode,
        payment_method: paymentMethod,
        shipping_cost: shippingCost,
        subtotal: subtotal,
        discount: discountAmount,
        courier: courierOptions.find(option => option.courier_code === selectedCourier)?.courier_name || 'Standard Shipping',
        items: orderItems
      })
    };
    
    // Coupon data is already included in the shipping_address JSON
    
    console.log('Creating order with data:', { ...orderData, items: `${orderItems.length} items` });
    
    // Create the order in the database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      console.error('Order creation error:', orderError);
      
      // Check if this is an RLS error
      if (orderError.message.includes('policy') || orderError.message.includes('permission')) {
        console.log('Detected RLS error, showing permission fix option');
        setShowRLSError(true);
      
      console.log('Creating order with data:', { ...orderData, items: `${orderItems.length} items` });
      
      // Create the order in the database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        
        // Check if this is an RLS error
        if (orderError.message.includes('policy') || orderError.message.includes('permission')) {
          console.log('Detected RLS error, showing permission fix option');
          setShowRLSError(true);
          setIsProcessing(false);
          return;
        }
        
        toast({
          title: "Order Error",
          description: `Failed to create order: ${orderError.message}`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      if (!order) {
        throw new Error('No order data returned after creation');
      }
      
      console.log('Order created successfully:', order.id);
      
      // Process payment or redirect based on payment method
      if (paymentMethod === 'online') {
        // Handle online payment
        console.log('Processing online payment for order:', order.id);
        await handleRazorpayPayment(order.id);
      } else {
        // Handle COD order
        console.log('Processing COD order:', order.id);
        
        // First clear cart and update UI state before making network requests
        // This prevents UI freezing during navigation
        clearCart();
        setIsProcessing(false);
        
        // Show success message
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully. Thank you for shopping with us!",
        });
        
        // Use setTimeout to ensure the UI updates before navigation
        setTimeout(() => {
          // Navigate to success page
          navigate(`/order-success?id=${order.id}`);
          
          // Send order notification email in background after navigation
          // This prevents blocking the UI
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendOrderNotification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              orderId: order.id,
              customerName: customerInfo.name,
              amount: finalTotal + shippingCost, // Include shipping cost in the total
              email: customerInfo.email,
              phone: customerInfo.phone,
              shippingCost: shippingCost,
              items: items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              }))
            })
          }).then(() => {
            console.log('Order notification sent successfully');
          }).catch((emailError) => {
            console.error('Failed to send order notification:', emailError);
          });
        }, 100);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {showRLSError && (
        <OrderPolicyError onFix={fixDatabasePermissions} />
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Customer Information */}
          {checkoutStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  onFormSubmit={handleFormSubmit}
                  initialData={customerInfo}
                  isSubmitting={isProcessing}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Step 2: Shipping & Payment */}
          {checkoutStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Shipping Options */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Shipping Options</h3>
                  
                  {pincode ? (
                    <ShiprocketServiceabilityChecker 
                      pincode={pincode}
                      setPincode={setPincode}
                      shippingCost={shippingCost}
                      setShippingCost={setShippingCost}
                      selectedCourier={selectedCourier}
                      setSelectedCourier={setSelectedCourier}
                      setCourierOptions={setCourierOptions}
                    />
                  ) : (
                    <Alert>
                      <AlertTitle>Pincode Required</AlertTitle>
                      <AlertDescription>
                        Please enter your shipping information to see available shipping options.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Payment method selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Method</h3>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay">Pay Online (Credit/Debit Card, Wallets)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi_direct" id="upi_direct" />
                      <Label htmlFor="upi_direct">Pay with UPI (PhonePe, Google Pay, Paytm)</Label>
                        <CreditCard className="h-5 w-5 text-brand-600 ml-auto" />
                      </label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="pt-4 flex flex-wrap gap-2">
                  <Button 
                    onClick={() => setCheckoutStep(1)} 
                    variant="outline" 
                  >
                    Back to Information
                  </Button>
                  {/* UPI Payment Component */}
                  {showUpiPayment && currentOrderId && (
                    <div className="mt-6 mb-4">
                      <DirectUpiHandler
                        orderId={currentOrderId}
                        amount={finalTotal + shippingCost}
                        customerName={customerInfo?.name || 'Customer'}
                        onComplete={() => {
                          setShowUpiPayment(false);
                          clearCart();
                          navigate(`/order-success/${currentOrderId}`);
                        }}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full mt-4" 
                        onClick={() => setShowUpiPayment(false)}
                      >
                        Cancel and Choose Another Payment Method
                      </Button>
                    </div>
                  )}
                  
                  {/* Place Order Button */}
                  {!showUpiPayment && (
                    <Button
                      className="w-full mt-6"
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !customerInfo || shippingCost <= 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cart Items Display */}
                {items.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center mt-1">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2 text-sm">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-2 text-red-500" 
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Coupon Code Input */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                      disabled={isCouponLoading || !!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        disabled={isCouponLoading}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isCouponLoading || !couponCode.trim()}
                      >
                        {isCouponLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.discount_percent}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost > 0 ? `₹${shippingCost}` : 'Calculate above'}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand-800">₹{finalTotal + shippingCost}</span>
                </div>
                
                {/* Customer info display */}
                {customerInfo && (
                  <>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <h4 className="font-semibold">Ship to:</h4>
                      <p>{customerInfo.name}</p>
                      <p>{customerInfo.address}</p>
                      <p>{customerInfo.city}, {customerInfo.state} {customerInfo.pincode}</p>
                      <p>{customerInfo.email}</p>
                      <p>{customerInfo.phone}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
