import React, { useState, useEffect } from 'react';

// Define the Supabase coupon data type
interface SupabaseCoupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: string | null;
  min_order_value?: number | null;
  created_at: string;
  created_by: string;
}
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash, Tag, Loader2, CreditCard, MapPin, Truck, CreditCard as CreditCardIcon, DollarSign, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerInfo, Coupon } from '@/types/product';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ShiprocketServiceabilityChecker from '@/components/checkout/ShiprocketServiceability';
import { processPayment } from '@/services/razorpayService';
import { loadScript } from '@/lib/utils';
import OrderPolicyError from '@/components/layout/OrderPolicyError';
import DirectPermissionFix from '@/components/admin/DirectPermissionFix';

const Checkout = () => {
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCart();
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
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<SupabaseCoupon | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Calculate final total
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = subtotal - discountAmount + shippingCost;

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

  // Handle quantity change
  const handleQuantityChange = (id: number, change: number) => {
    const item = items.find(item => item.id === id);
    if (item) {
      // If change is negative, decrease quantity but not below 1
      // If change is positive, increase quantity
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
        .single<SupabaseCoupon>();

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

      // Check if the cart total meets the minimum order value requirement
      if (data.min_order_value && subtotal < data.min_order_value) {
        toast({
          title: "Minimum Order Value Not Met",
          description: `This coupon requires a minimum order of ₹${data.min_order_value}. Your current order is ₹${subtotal.toFixed(2)}.`,
          variant: "destructive"
        });
        setIsCouponLoading(false);
        return;
      }

      // Apply the coupon
      setAppliedCoupon(data);
      
      // Calculate discount
      const discount = (subtotal * data.discount_percent) / 100;
      setDiscountAmount(discount);
      
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
    setAppliedCoupon(null);
    setDiscountAmount(0);
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

  // Completely rewritten payment handler using our new simplified service
  const handleRazorpayPayment = async (orderId: string) => {
    // Validate customer information
    if (!customerInfo) {
      toast({
        title: "Error",
        description: "Customer information is missing.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting payment process for order:', orderId);
      
      // Use our new simplified payment process function
      await processPayment(
        finalTotal,
        orderId,
        {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        // Success handler
        (response) => {
          console.log('Payment successful:', response);
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            toast({
              title: "Payment Error",
              description: "Received invalid payment response. Please contact support.",
              variant: "destructive"
            });
            setIsProcessing(false);
            return;
          }
          
          handlePaymentSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }, orderId);
        },
        // Failure handler
        (error) => {
          console.error('Payment failed:', error);
          handlePaymentFailure(orderId, error.message || "Payment failed. Please try again later.");
          setIsProcessing(false);
        }
      );
      
      return true;
    } catch (error: any) {
      console.error('Payment error:', error);
      handlePaymentFailure(orderId, error.message || "Failed to initialize payment. Please try again later.");
      setIsProcessing(false);
      return false;
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

  // Helper function to update order payment status with retry logic
  const updateOrderPaymentStatus = async (orderId: string, status: string) => {
    try {
      console.log(`Updating order ${orderId} payment status to ${status}`);
      
      // Try up to 3 times to update the order status
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to update order status`);
        
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: status, // Use the status field instead of payment_status
            payment_id: JSON.stringify({ payment_status: status, updated_at: new Date().toISOString() })
          })
          .eq('id', orderId);
        
        if (error) {
          console.error(`Error updating order status (attempt ${attempts}):`, error);
          // Wait a bit before retrying
          if (attempts < 3) await new Promise(r => setTimeout(r, 1000));
        } else {
          console.log(`Successfully updated order ${orderId} status to ${status}`);
          success = true;
        }
      }
      
      if (!success) {
        toast({
          title: "Database Error",
          description: "Failed to update order status. Please contact support.",
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
    }
  };
  
  // Place order
  const handlePlaceOrder = async () => {
    if (!customerInfo) {
      toast({
        title: "Error",
        description: "Please fill in your information first.",
        variant: "destructive"
      });
      setCheckoutStep(1);
      return;
    }
    
    if (!selectedCourier || shippingCost === 0) {
      toast({
        title: "Error",
        description: "Please select a shipping method.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create order in database
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image_url: item.image_url
      }));
      
      // Create order data with fields matching the database schema
      const orderData = {
        total_amount: finalTotal,
        status: 'pending',
        user_id: user?.id || null,
        // Store all other order details as JSON in shipping_address
        shipping_address: JSON.stringify({
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          pincode: customerInfo.pincode,
          subtotal: subtotal,
          discount: discountAmount,
          shipping_cost: shippingCost,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'initiated',
          items: orderItems,
          courier_name: selectedCourier,
          ...(appliedCoupon ? {
            coupon_code: appliedCoupon.code,
            coupon_discount_percent: appliedCoupon.discount_percent
          } : {})
        })
      };
      
      console.log('Creating order with data:', { ...orderData, items: `${orderItems.length} items` });
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        
        // Check if this is an RLS error
        if (orderError.message.includes('policy') || orderError.message.includes('permission')) {
          console.log('Detected RLS error, showing permission fix option');
          setShowRLSError(true);
          throw new Error('Database permission error. Please use the "Fix Permissions" button below.');
        }
        
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      if (!order) {
        throw new Error('Failed to create order: No order data returned');
      }
      
      console.log('Order created successfully:', order);
      
      // Process payment or redirect based on payment method
      if (paymentMethod === 'online') {
        console.log('Processing online payment for order:', order.id);
        await handleRazorpayPayment(order.id);
      } else {
        // COD order - update status and redirect
        console.log('Processing COD order:', order.id);
        
        // Show success message
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully. Thank you for shopping with us!",
        });
        
        // Clear cart and redirect to success page
        clearCart();
        navigate(`/order-success?id=${order.id}`);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      
      // Show error message
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
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-medium mb-4 text-green-800 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-700" />
                    Shipping Options
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Enter delivery pincode"
                        value={pincode}
                        onChange={(e) => {
                          // Only allow numbers and limit to 6 digits
                          const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
                          setPincode(value);
                          
                          // Automatically check when pincode is 6 digits
                          if (value.length === 6) {
                            // Auto-trigger shipping check
                            console.log('Auto-checking pincode:', value);
                            
                            // Simulate loading state
                            const tempCouriers = [
                              {
                                courier_name: "Express Delivery",
                                courier_code: "express",
                                rate: 120,
                                etd: "1-2 days",
                                serviceability_type: "express"
                              },
                              {
                                courier_name: "Standard Shipping",
                                courier_code: "standard",
                                rate: 80,
                                etd: "3-5 days",
                                serviceability_type: "standard"
                              },
                              {
                                courier_name: "Economy Shipping",
                                courier_code: "economy",
                                rate: 50,
                                etd: "5-7 days",
                                serviceability_type: "economy"
                              }
                            ];
                            
                            // Automatically select the first courier option
                            setSelectedCourier(tempCouriers[0].courier_code);
                            setShippingCost(tempCouriers[0].rate);
                            
                            toast({
                              title: "Delivery Available",
                              description: "We've found delivery options for your location.",
                              variant: "default"
                            });
                          } else {
                            // Reset courier selection if pincode is changed
                            setSelectedCourier('');
                            setShippingCost(0);
                          }
                        }}
                        className="flex-grow focus:ring-green-500 focus:border-green-500"
                        maxLength={6}
                      />
                    </div>
                    
                    {pincode.length === 6 ? (
                      <div className="mt-4 space-y-3">
                        <RadioGroup 
                          value={selectedCourier} 
                          onValueChange={setSelectedCourier}
                          className="space-y-3"
                        >
                          <div onClick={() => {
                            setSelectedCourier('express');
                            setShippingCost(120);
                          }} className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${selectedCourier === 'express' ? 'bg-green-100 border-green-500 border' : 'bg-white border'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="express" id="express" />
                              <div>
                                <p className="font-medium">Express Delivery</p>
                                <p className="text-sm text-gray-500">1-2 days</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-700">₹120</p>
                          </div>
                          
                          <div onClick={() => {
                            setSelectedCourier('standard');
                            setShippingCost(80);
                          }} className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${selectedCourier === 'standard' ? 'bg-green-100 border-green-500 border' : 'bg-white border'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="standard" id="standard" />
                              <div>
                                <p className="font-medium">Standard Shipping</p>
                                <p className="text-sm text-gray-500">3-5 days</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-700">₹80</p>
                          </div>
                          
                          <div onClick={() => {
                            setSelectedCourier('economy');
                            setShippingCost(50);
                          }} className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${selectedCourier === 'economy' ? 'bg-green-100 border-green-500 border' : 'bg-white border'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="economy" id="economy" />
                              <div>
                                <p className="font-medium">Economy Shipping</p>
                                <p className="text-sm text-gray-500">5-7 days</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-700">₹50</p>
                          </div>
                        </RadioGroup>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Enter your 6-digit pincode to check delivery options</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium mb-4 text-blue-800 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-blue-700" />
                    Payment Method
                  </h3>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-blue-100 border-blue-500 border' : 'bg-white border'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="cod" id="cod" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when you receive your items</p>
                        </div>
                      </div>
                      <DollarSign className="h-5 w-5 text-blue-700" />
                    </div>
                    
                    <div 
                      onClick={() => setPaymentMethod('online')}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${paymentMethod === 'online' ? 'bg-blue-100 border-blue-500 border' : 'bg-white border'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="online" id="online" />
                        <div>
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-gray-500">Pay securely with credit/debit card</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {!isRazorpayReady && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        <CreditCardIcon className="h-5 w-5 text-blue-700" />
                      </div>
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
                  <Button 
                    onClick={handlePlaceOrder} 
                    className="bg-green-600 hover:bg-green-700 text-white font-medium flex-grow md:flex-grow-0 px-6 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    disabled={isProcessing || !selectedCourier || shippingCost === 0}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span className="text-base">Processing your order...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {paymentMethod === 'online' ? <CreditCardIcon className="mr-2 h-5 w-5" /> : <ShoppingBag className="mr-2 h-5 w-5" />}
                        <span className="text-base">{`Place Order${paymentMethod === 'online' ? ' & Pay Now' : ''}`}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg border-b border-green-100">
              <CardTitle className="text-xl text-green-800 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-green-700" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {/* Cart items */}
              {items.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex space-x-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-20 h-20 rounded-md overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <span className="font-medium text-green-700">₹{item.price}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">Natural, organic ingredients</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-1 bg-gray-50 rounded-full p-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-gray-200" 
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-gray-200" 
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex space-x-3 items-center">
                              <span className="text-sm font-semibold text-green-700">₹{item.price * item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Entry */}
                  <div className="mt-6 mb-2 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-green-700" />
                      Apply Coupon
                    </h4>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon || isCouponLoading}
                        className="flex-grow focus:ring-green-500 focus:border-green-500"
                      />
                      {appliedCoupon ? (
                        <Button 
                          onClick={handleRemoveCoupon}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Trash className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isCouponLoading}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200"
                        >
                          {isCouponLoading ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="mr-1 h-4 w-4" />
                          )}
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{subtotal}</span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon.discount_percent}%)</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
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
                      <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Customer info display */}
                  {customerInfo && (
                    <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h4 className="font-semibold flex items-center text-gray-800">
                        <MapPin className="h-4 w-4 mr-2 text-green-700" />
                        Shipping Address
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{customerInfo.name}</p>
                        <p>{customerInfo.address}</p>
                        <p>{customerInfo.city}, {customerInfo.state} {customerInfo.pincode}</p>
                        <p>{customerInfo.email}</p>
                        <p>{customerInfo.phone}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Your cart is empty</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => navigate('/products')}
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
