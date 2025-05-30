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
import { Label } from "@/components/ui/label";
import { CustomerInfo, Coupon } from '@/types/product';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ShiprocketServiceabilityChecker from '@/components/checkout/ShiprocketServiceability';
import { processPayment } from '@/services/razorpayService';
import DirectUpiHandler from '@/components/DirectUpiHandler';
import { loadScript } from '@/lib/utils';
import OrderPolicyError from '@/components/layout/OrderPolicyError';
import DirectPermissionFix from '@/components/admin/DirectPermissionFix';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, clearCart, removeItem } = useCart();
  const { user } = useAuth();

  // State variables
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showRLSError, setShowRLSError] = useState(false);
  const [pincode, setPincode] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [courierOptions, setCourierOptions] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [upiApp, setUpiApp] = useState('');

  // Calculate final total
  useEffect(() => {
    const discount = appliedCoupon ? (subtotal * appliedCoupon.discount_percent) / 100 : 0;
    setDiscountAmount(discount);
    setFinalTotal(subtotal - discount + shippingCost);
  }, [subtotal, appliedCoupon, shippingCost]);

  // Handle quantity change
  const handleQuantityChange = (id: string, quantity: number) => {
    // Implement quantity change logic
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsCouponLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Check if coupon is valid
        const currentDate = new Date();
        const startDate = data.valid_from ? new Date(data.valid_from) : null;
        const endDate = data.valid_until ? new Date(data.valid_until) : null;
        
        if ((startDate && currentDate < startDate) || (endDate && currentDate > endDate)) {
          toast({
            title: "Coupon Expired",
            description: "This coupon is no longer valid.",
            variant: "destructive"
          });
          return;
        }
        
        // Check minimum order value
        if (data.min_order_value && subtotal < data.min_order_value) {
          toast({
            title: "Cannot Apply Coupon",
            description: `Minimum order value of ₹${data.min_order_value} required.`,
            variant: "destructive"
          });
          return;
        }
        
        // Apply coupon
        setAppliedCoupon(data);
        localStorage.setItem('appliedCoupon', JSON.stringify(data));
        
        toast({
          title: "Coupon Applied",
          description: `You got ${data.discount_percent}% off!`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is invalid.",
          variant: "destructive"
        });
      }
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
    localStorage.removeItem('appliedCoupon');
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
    if (!customerInfo) {
      toast({
        title: 'Error',
        description: 'Please enter your information first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create order first
      const orderId = await createOrder(finalTotal - shippingCost);
      
      if (!orderId) {
        setIsProcessing(false);
        return;
      }
      
      // Process UPI payment
      const { success, upiUrl, txnRef, upiId } = await processPayment({
        amount: totalWithShipping,
        orderId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentMethod: 'upi_direct',
        upiApp: upiApp
      });
      
      if (success && upiUrl) {
        // Open UPI app
        window.location.href = upiUrl;
      } else {
        // Handle error
        await supabase
          .from('orders')
          .update({ 
            payment_method: 'upi_direct',
            payment_status: 'failed',
            status: 'payment_failed'
          })
          .eq('id', orderId);
          
        toast({
          title: "Payment Error",
          description: "Failed to initiate UPI payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error initiating UPI payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate UPI payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!customerInfo) {
      toast({
        title: 'Error',
        description: 'Please enter your information first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Load Razorpay script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      if (!res) {
        toast({
          title: "Razorpay Error",
          description: "Razorpay SDK failed to load. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Create order
      const orderId = await createOrder(finalTotal - shippingCost);
      
      if (!orderId) {
        setIsProcessing(false);
        return;
      }
      
      // Process payment
      const { success, data } = await processPayment({
        amount: finalTotal,
        orderId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentMethod: 'razorpay'
      });
      
      if (success && data) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: finalTotal * 100,
          currency: 'INR',
          name: 'Natural Puff',
          description: `Payment for order #${orderId}`,
          order_id: data.id,
          handler: async function(response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }, orderId: string) {
            await handlePaymentSuccess(response, orderId);
          }.bind(null, orderId),
          prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone
          },
          notes: {
            order_id: orderId
          },
          theme: {
            color: '#3399cc'
          }
        };
        
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      } else {
        toast({
          title: "Payment Error",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: any, orderId: string) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
      
      // Verify payment
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_id: razorpay_payment_id,
          payment_status: 'completed',
          status: 'processing'
        })
        .eq('id', orderId)
        .select();
      
      if (error) throw error;
      
      // Send order notification
      setTimeout(() => {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendOrderNotification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            orderId,
            paymentId: razorpay_payment_id,
            customerName: customerInfo?.name,
            customerEmail: customerInfo?.email,
            customerPhone: customerInfo?.phone
          })
        }).then(() => {
          console.log('Order notification sent successfully');
        }).catch((emailError) => {
          console.error('Failed to send order notification:', emailError);
        });
      }, 100);
      
      // Clear cart and navigate to success page
      clearCart();
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully!"
      });
      
      // Navigate to order success page
      setTimeout(() => {
        navigate(`/order-success?id=${orderId}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process your payment. Please contact support.",
        variant: "destructive"
      });
      
      navigate('/checkout');
    }
  };

  // Handle payment failure
  const handlePaymentFailure = async (orderId: string, errorMessage: string) => {
    try {
      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'payment_failed'
        })
        .eq('id', orderId);
      
      toast({
        title: "Payment Failed",
        description: errorMessage || "Your payment could not be processed. Please try again.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error updating failed payment status:', error);
    }
  };

  // Create order
  const createOrder = async (amount: number) => {
    try {
      if (!customerInfo) {
        toast({
          title: 'Error',
          description: 'Please enter your information first',
          variant: 'destructive',
        });
        return null;
      }
      
      // Validate shipping cost
      if (selectedCourier === '' || shippingCost <= 0) {
        toast({
          title: 'Error',
          description: 'Please select a shipping method',
          variant: 'destructive',
        });
        return null;
      }
      
      // Create order items
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image_url: item.image_url
      }));
      
      // Create order in database
      const { data, error } = await supabase
        .from('orders')
        .insert({
          total_amount: finalTotal,
          user_id: user?.id || null,
          shipping_address: {
            name: customerInfo.name,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            pincode: customerInfo.pincode,
            email: customerInfo.email,
            phone: customerInfo.phone,
            payment_method: paymentMethod,
            shipping_cost: shippingCost,
            subtotal: subtotal,
            discount: discountAmount,
            courier: courierOptions.find(c => c.courier_company_id === selectedCourier)
          },
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        // Check for RLS policy error
        if (error.message.includes('policy')) {
          setShowRLSError(true);
          return null;
        }
        
        throw error;
      }
      
      if (data) {
        // Insert order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(
            orderItems.map(item => ({
              order_id: data.id,
              ...item
            }))
          );
        
        if (itemsError) {
          setShowRLSError(true);
          setIsProcessing(false);
          return null;
        }
        
        toast({
          title: 'Order Created',
          description: `Order #${data.id} has been created.`
        });
        
        setCurrentOrderId(data.id);
        return data.id;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'Order Error',
        description: error.message || 'Failed to create your order. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
      return null;
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
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
      
      // Process payment based on method
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else if (paymentMethod === 'upi_direct') {
        setShowUpiPayment(true);
        setIsProcessing(false);
      } else {
        // Cash on delivery
        const orderId = await createOrder(finalTotal - shippingCost);
        
        if (orderId) {
          // Update order status
          await supabase
            .from('orders')
            .update({
              payment_method: 'cod',
              payment_status: 'pending',
              status: 'processing'
            })
            .eq('id', orderId);
          
          // Clear cart and navigate to success page
          clearCart();
          setIsProcessing(false);
          
          toast({
            title: "Order Placed",
            description: "Your order has been placed successfully!"
          });
          
          // Navigate to order success page
          setTimeout(() => {
            navigate(`/order-success?id=${orderId}`);
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {showRLSError && (
        <DirectPermissionFix onFix={() => Promise.resolve(true)} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {checkoutStep === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  onSubmit={handleFormSubmit}
                  initialValues={customerInfo}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {pincode && (
                  <div className="mb-6">
                    <ShiprocketServiceabilityChecker 
                      pincode={pincode}
                      onServiceabilityCheck={(serviceability) => {
                        setPincode(serviceability.pincode);
                        setShippingCost(serviceability.shippingCost);
                        setSelectedCourier(serviceability.selectedCourier);
                        setCourierOptions(serviceability.courierOptions);
                      }}
                    />
                  </div>
                )}
                
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
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="pt-4 flex flex-wrap gap-2">
                  <Button 
                    onClick={() => setCheckoutStep(1)} 
                    variant="outline"
                  >
                    Back
                  </Button>
                  
                  {showUpiPayment && currentOrderId ? (
                    <DirectUpiHandler 
                      orderId={currentOrderId}
                      amount={finalTotal}
                      customerInfo={customerInfo}
                      onSuccess={() => {
                        setShowUpiPayment(false);
                        clearCart();
                        navigate(`/order-success?id=${currentOrderId}`);
                      }}
                      onCancel={() => setShowUpiPayment(false)}
                    />
                  ) : (
                    <Button 
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
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No items in cart</p>
                )}
                
                <Separator />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    {isCouponLoading || appliedCoupon ? (
                      <div>
                        {appliedCoupon ? (
                          <Button
                            onClick={handleRemoveCoupon}
                            disabled={isCouponLoading}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={isCouponLoading || !couponCode}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  {isCouponLoading && <p className="text-sm">Checking coupon...</p>}
                </div>
                
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p className="font-medium">₹{subtotal.toFixed(2)}</p>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <p>Discount ({appliedCoupon.discount_percent}%)</p>
                    <p className="font-medium">-₹{discountAmount.toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p className="font-medium">
                    {shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Calculating...'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <p className="font-medium">Total</p>
                  <p className="font-medium">₹{(finalTotal).toFixed(2)}</p>
                </div>
                
                {customerInfo && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="font-medium">Shipping to:</p>
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
