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
import { initializeRazorpay, createRazorpayInstance, createRazorpayOrder } from '@/services/razorpayService';
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
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Calculate final total
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = subtotal - discountAmount + shippingCost;

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

  // Helper function to update order payment status
  const updateOrderPaymentStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) {
        console.error('Failed to update order status:', error);
      } else {
        console.log(`Order ${orderId} status updated to ${status}`);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

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

      // Apply the coupon
      setAppliedCoupon(data);
      
      // Calculate discount
      const discount = (subtotal * data.discount_percent) / 100;
      setDiscountAmount(Math.min(discount, data.max_discount || Infinity));
      
      toast({
        title: "Coupon Applied",
        description: `Discount of ${data.discount_percent}% applied successfully.`,
      });
    } catch (error) {
      console.error("Error applying coupon:", error);
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
    setCouponCode('');
    setDiscountAmount(0);
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
    });
  };

  // Handle form submission
  const handleFormSubmit = (formData: CustomerInfo) => {
    setCustomerInfo(formData);
    setCheckoutStep(2);
    console.log("Customer information:", formData);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderId: string) => {
    try {
      console.log('Initializing Razorpay payment for order:', orderId);
      
      // Get Razorpay key from environment
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured. Please check your environment variables.');
      }

      // Initialize Razorpay if not already loaded
      if (!isRazorpayReady) {
        console.log('Initializing Razorpay...');
        const loaded = await initializeRazorpay();
        if (!loaded) {
          throw new Error('Failed to load Razorpay checkout. Please check your internet connection and try again.');
        }
        setIsRazorpayReady(true);
      }

      // First, create a Razorpay order using the Edge Function
      console.log('Creating Razorpay order for amount:', finalTotal);
      const razorpayOrder = await createRazorpayOrder(
        finalTotal,
        'INR',
        `order_${orderId}`,
        { order_id: orderId }
      );
      
      console.log('Razorpay order created:', razorpayOrder);
      
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to create Razorpay order. Please try again.');
      }

      // Prepare payment options with the new order ID from Razorpay
      const options = {
        key: razorpayKey,
        amount: Math.round(finalTotal * 100), // convert to lowest denomination (paise) and ensure it's an integer
        currency: 'INR',
        name: 'Natural Puff',
        description: 'Payment for your order',
        order_id: razorpayOrder.id, // Use the Razorpay order ID, not our internal order ID
        prefill: {
          name: customerInfo?.name || '',
          email: customerInfo?.email || '',
          contact: customerInfo?.phone || '',
        },
        theme: {
          color: '#167152', // brand primary color
        },
        handler: function(response: any) {
          // Validate response
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            console.error('Invalid Razorpay response:', response);
            toast({
              title: "Payment Error",
              description: "Received invalid payment response. Please contact support.",
              variant: "destructive"
            });
            return;
          }
          
          // Update order with payment details
          handlePaymentSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }, orderId);
        },
        // Add modal closing handler
        modal: {
          ondismiss: function() {
            console.log('Checkout form closed by user');
            // Mark the order as payment_failed when user dismisses the payment window
            updateOrderPaymentStatus(orderId, 'payment_failed');
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. Your order is saved but payment is incomplete.",
            });
            // Redirect to order success page with payment=failed parameter
            navigate(`/order-success?id=${orderId}&payment=failed`);
          }
        }
      };

      console.log('Creating Razorpay instance with options:', {
        ...options,
        key: '***HIDDEN***',
        prefill: '***HIDDEN***'
      });
      
      const razorpay = createRazorpayInstance(options);
      
      if (!razorpay) {
        throw new Error('Failed to create Razorpay checkout instance. Please try again later.');
      }
      
      // Open Razorpay checkout
      console.log('Opening Razorpay checkout...');
      razorpay.open();
      return true;
    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      // Update the order status to payment_failed
      if (orderId) {
        updateOrderPaymentStatus(orderId, 'payment_failed');
      }
      
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again later.",
        variant: "destructive"
      });
      
      // Redirect to order success page with payment=failed parameter
      if (orderId) {
        navigate(`/order-success?id=${orderId}&payment=failed`);
      }
      
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

  // Fix database permissions
  const fixDatabasePermissions = async () => {
    try {
      console.log('Attempting to fix database permissions...');
      const { data, error } = await supabase.functions.invoke('fixOrderPermissions');
      
      if (error) {
        console.error('Error fixing permissions:', error);
        throw error;
      }
      
      console.log('Permissions fixed successfully:', data);
      toast({
        title: 'Permissions Fixed',
        description: 'Database permissions have been configured. Please try placing your order again.',
      });
      
      return true;
    } catch (error) {
      console.error('Failed to fix permissions:', error);
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
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCourier || shippingCost === 0) {
      toast({
        title: "Shipping Required",
        description: "Please select a shipping method.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setShowRLSError(false);

    try {
      console.log('Placing order...');
      
      // Create order payload
      const orderPayload = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: customerInfo.address,
        shipping_city: customerInfo.city,
        shipping_state: customerInfo.state,
        shipping_pincode: customerInfo.pincode,
        total_amount: finalTotal,
        status: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
        payment_method: paymentMethod,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        coupon_id: appliedCoupon?.id || null,
        user_id: user?.id || null,
        courier_name: selectedCourier
      };
      
      console.log('Order payload:', orderPayload);
      
      // Create order in database
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        
        // Check if it's an RLS policy error
        if (orderError.message?.includes("row-level security policy") || 
            orderError.code === '42501') {
          setShowRLSError(true);
          
          // Automatically attempt to fix the permissions using the new comprehensive fix
          console.log('Detected RLS policy error, attempting to fix permissions with fixAllPermissions...');
          
          try {
            // Call the new comprehensive fixAllPermissions Edge Function
            const { data, error } = await supabase.functions.invoke('fixAllPermissions');
            
            if (error) {
              console.error('Error from fixAllPermissions function:', error);
              throw error;
            }
            
            console.log('Permissions fixed successfully:', data);
            
            // Try placing the order again immediately
            console.log('Attempting to place order again after fixing permissions...');
            
            // Small delay to ensure permissions are applied
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try creating the order again with the same payload
            const { data: retryOrderResult, error: retryOrderError } = await supabase
              .from('orders')
              .insert(orderPayload)
              .select();
              
            if (retryOrderError) {
              console.error('Still encountering error after permission fix:', retryOrderError);
              throw new Error("Database permission error persists. Please try again later.");
            }
            
            if (!retryOrderResult || retryOrderResult.length === 0) {
              throw new Error("Failed to create order after fixing permissions");
            }
            
            // Continue with the order process using the retry result
            const order = retryOrderResult[0];
            
            // Insert order items
            const orderItems = items.map(item => ({
              order_id: order.id,
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              product_name: item.name
            }));
            
            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);
              
            if (itemsError) {
              console.error("Order items insertion error after permission fix:", itemsError);
              throw new Error(itemsError.message || "Failed to add order items");
            }
            
            // Continue with the rest of the order process
            // Send email notification and handle payment
            // This is duplicate code, but necessary to continue the flow
            try {
              await supabase.functions.invoke('sendOrderNotification', {
                body: {
                  orderId: order.id,
                  customerName: customerInfo.name,
                  amount: finalTotal,
                  email: customerInfo.email,
                  phone: customerInfo.phone,
                  items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  }))
                }
              });
              console.log("Order notification email sent");
            } catch (emailError) {
              console.error("Failed to send order notification email:", emailError);
              // Continue with order process even if email fails
            }
            
            // Handle payment based on selected method
            if (paymentMethod === 'online') {
              // Process with Razorpay
              await handleRazorpayPayment(order.id);
            } else {
              // For COD orders
              toast({
                title: "Order Placed Successfully",
                description: "Your order has been placed. Thank you for shopping with us!",
              });
              
              clearCart();
              navigate(`/order-success?id=${order.id}`);
            }
            
            return; // Exit early as we've handled everything
          } catch (fixError) {
            console.error('Failed to fix permissions or retry order:', fixError);
            throw new Error("Database permission error. Please fix the permissions to continue.");
          }
        }
        
        throw new Error(orderError.message || "Failed to create order");
      }
      
      if (!orderResult || orderResult.length === 0) {
        throw new Error("Failed to create order: No order data returned");
      }
      
      const order = orderResult[0];
      console.log("Order created successfully:", order);
      
      // Add order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) {
        console.error("Order items insertion error:", itemsError);
        throw new Error(itemsError.message || "Failed to add order items");
      }
      
      console.log("Order items added successfully");
      
      // Send order notification email
      try {
        await supabase.functions.invoke('sendOrderNotification', {
          body: {
            orderId: order.id,
            customerName: customerInfo.name,
            amount: finalTotal,
            email: customerInfo.email,
            phone: customerInfo.phone,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            }))
          }
        });
        console.log("Order notification email sent");
      } catch (emailError) {
        console.error("Failed to send order notification email:", emailError);
        // Continue with order process even if email fails
      }
      
      // Handle payment based on selected method
      if (paymentMethod === 'online') {
        // Process with Razorpay
        await handleRazorpayPayment(order.id);
      } else {
        // For COD orders
        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed. Thank you for shopping with us!",
        });
        
        clearCart();
        navigate(`/order-success?id=${order.id}`);
      }
    } catch (error: any) {
      console.error("Order placement error:", error);
      
      toast({
        title: "Order Error",
        description: error.message || "There was a problem placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-custom py-6 md:py-12">
      {showRLSError && <DirectPermissionFix />}
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8 text-center font-playfair text-brand-800">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Customer Information */}
          {checkoutStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  onSubmit={handleFormSubmit} 
                  initialData={customerInfo}
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
                  <h3 className="font-medium mb-3">Shipping Options</h3>
                  <ShiprocketServiceabilityChecker 
                    pincode={customerInfo?.pincode || ''} 
                    onPincodeChange={setPincode}
                    onCourierSelect={(courier, cost) => {
                      setSelectedCourier(courier);
                      setShippingCost(cost);
                    }}
                    selectedCourier={selectedCourier}
                  />
                </div>
                
                {/* Payment Method */}
                <div>
                  <h3 className="font-medium mb-3">Payment Method</h3>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 border rounded-md p-3">
                      <RadioGroupItem value="cod" id="cod" />
                      <label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-gray-500">Pay when your order arrives</div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-md p-3">
                      <RadioGroupItem value="online" id="online" />
                      <label htmlFor="online" className="flex-1 cursor-pointer flex items-center space-x-2">
                        <div>
                          <div className="font-medium">Online Payment</div>
                          <div className="text-sm text-gray-500">Pay securely with Razorpay</div>
                        </div>
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
                  <Button 
                    onClick={handlePlaceOrder} 
                    className="bg-brand-600 hover:bg-brand-700 flex-grow md:flex-grow-0"
                    disabled={isProcessing || !selectedCourier || shippingCost === 0}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order${paymentMethod === 'online' ? ' & Pay Now' : ''}`
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
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                  <span className="text-brand-800">₹{finalTotal}</span>
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
