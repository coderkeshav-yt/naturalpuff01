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
import { Minus, Plus, Trash, Tag, Loader2, CreditCard, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CustomerInfo, Coupon } from '@/types/product';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ShiprocketServiceabilityChecker from '@/components/checkout/ShiprocketServiceability';
import { processPayment, loadRazorpayScript } from '@/services/razorpayService';
import ProcessingOverlay from '@/components/payment/ProcessingOverlay';
import DirectUpiHandler from '@/components/DirectUpiHandler';
import { loadScript } from '@/lib/utils';
import OrderPolicyError from '@/components/layout/OrderPolicyError';
import DirectPermissionFix from '@/components/admin/DirectPermissionFix';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalPrice, clearCart, removeItem, updateQuantity, applyCoupon, removeCoupon, finalTotal: cartFinalTotal, discountAmount: cartDiscountAmount, appliedCoupon: cartAppliedCoupon } = useCart();
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
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [upiApp, setUpiApp] = useState('');

  // Calculate final total
  useEffect(() => {
    setDiscountAmount(cartDiscountAmount);
    setFinalTotal(cartFinalTotal + shippingCost);
  }, [cartFinalTotal, cartDiscountAmount, shippingCost]);

  // Handle quantity change
  const handleQuantityChange = (id: number, quantity: number) => {
    updateQuantity(id, quantity);
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
        if (data.min_order_value && totalPrice < data.min_order_value) {
          toast({
            title: "Cannot Apply Coupon",
            description: `Minimum order value of ₹${data.min_order_value} required.`,
            variant: "destructive"
          });
          return;
        }
        
        // Apply coupon
        applyCoupon(data);
        
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
    removeCoupon();
    setCouponCode('');
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order."
    });
  };

  // Handle form submission
  const handleFormSubmit = (formData: CustomerInfo) => {
    try {
      console.log('Form submitted with data:', formData);
      setCustomerInfo(formData);
      setPincode(formData.pincode);
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Automatically check pincode availability
      setTimeout(() => {
        if (formData.pincode && formData.pincode.length === 6) {
          console.log('Auto-checking pincode:', formData.pincode);
          const mockCourierOptions = [
            {
              courier_name: "DTDC",
              courier_code: "1",
              rate: 120,
              etd: "2-3 days",
              serviceability_type: "surface"
            },
            {
              courier_name: "Delhivery",
              courier_code: "2",
              rate: 150,
              etd: "1-2 days",
              serviceability_type: "air"
            }
          ];
          
          setCourierOptions(mockCourierOptions);
          setSelectedCourier(mockCourierOptions[0].courier_code);
          setShippingCost(mockCourierOptions[0].rate);
          
          toast({
            title: "Delivery Available",
            description: "We can deliver to your location.",
            variant: "default"
          });
        }
      }, 500);
    } catch (error) {
      console.error('Error in handleFormSubmit:', error);
      toast({
        title: "Error",
        description: "There was a problem processing your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle UPI direct payment
  const handleUpiDirectPayment = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting UPI direct payment flow');
      
      if (!upiApp) {
        toast({
          title: "Select UPI App",
          description: "Please select a UPI app to continue",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Create order first
      const orderId = await createOrder(finalTotal - shippingCost);
      
      if (!orderId) {
        console.error('Failed to create order for UPI payment');
        setIsProcessing(false);
        return;
      }
      
      console.log('Order created successfully for UPI payment:', orderId);
      
      // Set current order ID for UPI handler
      setCurrentOrderId(orderId);
      
      // Store order ID in localStorage for verification after app redirect
      localStorage.setItem('current_order_id', orderId);
      
      setShowUpiPayment(true);
      setIsProcessing(false);
      
    } catch (error: any) {
      console.error('Error in UPI direct payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate UPI payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting Razorpay payment flow');
      
      // Create order first
      const orderId = await createOrder(finalTotal - shippingCost);
      
      if (!orderId) {
        console.error('Failed to create order for Razorpay payment');
        setIsProcessing(false);
        return;
      }
      
      console.log('Order created successfully:', orderId);
      
      // Ensure customer info is available
      if (!customerInfo) {
        toast({
          title: 'Error',
          description: 'Customer information is missing',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
      
      // Process payment using the razorpayService
      await processPayment(
        finalTotal,
        orderId,
        {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        (response) => {
          // Success callback
          console.log('Payment successful:', response);
          handlePaymentSuccess(response, orderId);
        },
        (error) => {
          // Failure callback
          console.error('Payment failed:', error);
          toast({
            title: "Payment Error",
            description: error.message || "Failed to process payment. Please try again.",
            variant: "destructive"
          });
          setIsProcessing(false);
        }
      );
      
    } catch (error: any) {
      console.error('Error in Razorpay payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
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
      console.log('Creating order with amount:', amount);
      console.log('Customer info:', customerInfo);
      console.log('Selected courier:', selectedCourier);
      console.log('Shipping cost:', shippingCost);
      
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
        product_name: item.name, // Use product_name instead of name to match the schema
        image_url: item.image_url || ''
      }));
      
      console.log('Order items:', orderItems);
      
      // Get selected courier info
      const selectedCourierInfo = courierOptions.find((c: any) => c.courier_code === selectedCourier) || {
        courier_name: 'Standard Delivery',
        rate: shippingCost,
        etd: '3-5 days'
      };
      
      console.log('Selected courier info:', selectedCourierInfo);
      
      // Simplified order creation to avoid potential issues
      const orderData = {
        total_amount: finalTotal,
        user_id: user?.id || null,
        shipping_address: JSON.stringify({
          name: customerInfo.name,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          pincode: customerInfo.pincode,
          email: customerInfo.email,
          phone: customerInfo.phone,
          shipping_cost: shippingCost,
          courier_name: selectedCourierInfo.courier_name
        }),
        status: 'pending'
      };
      
      console.log('Order data being inserted:', orderData);
      
      // Create order in database
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting order:', error);
        // Check for RLS policy error
        if (error.message.includes('policy')) {
          console.log('RLS policy error detected');
          setShowRLSError(true);
          return null;
        }
        
        throw error;
      }
      
      if (data) {
        console.log('Order created successfully:', data);
        
        // Insert order items
        try {
          const orderItemsWithId = orderItems.map(item => ({
            order_id: data.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name
          }));
          
          console.log('Inserting order items:', orderItemsWithId);
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsWithId);
          
          if (itemsError) {
            console.error('Error inserting order items:', itemsError);
            // Continue even if order items insertion fails
            // We'll handle this case better
          }
        } catch (itemsError) {
          console.error('Error in order items insertion:', itemsError);
          // Continue with the order even if items insertion fails
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
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Database Permission Error</AlertTitle>
          <AlertDescription>
            There was an issue with database permissions. Please try again or contact support.
          </AlertDescription>
        </Alert>
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
                  onFormSubmit={handleFormSubmit}
                  initialData={customerInfo}
                  isSubmitting={isProcessing}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <ProcessingOverlay 
                    orderId={currentOrderId} 
                    onCancel={() => {
                      setIsProcessing(false);
                      // Clear payment flags
                      localStorage.removeItem('payment_in_progress');
                      sessionStorage.removeItem('np_current_payment');
                      localStorage.removeItem('np_current_payment');
                    }} 
                  />
                ) : (
                  <div>
                    {pincode && (
                      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-md font-medium">Shipping Options</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Delivering to:</span>
                            <span className="font-medium text-sm bg-white px-2 py-1 rounded border">{pincode}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-grow">
                              <Input
                                type="text"
                                placeholder="Enter delivery pincode"
                                value={pincode}
                                onChange={(e) => {
                                  // Only allow numbers and limit to 6 digits
                                  const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
                                  setPincode(value);
                                  
                                  // Reset selection if pincode changes
                                  if (value.length !== 6) {
                                    setSelectedCourier('');
                                    setShippingCost(0);
                                    setCourierOptions([]);
                                  }
                                }}
                                className="w-full"
                                maxLength={6}
                              />
                            </div>
                            <Button 
                              onClick={() => {
                                if (!pincode || pincode.length !== 6) {
                                  toast({
                                    title: "Invalid Pincode",
                                    description: "Please enter a valid 6-digit pincode.",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                
                                // Directly use hardcoded shipping options
                                const mockCourierOptions = [
                                  {
                                    courier_name: "DTDC",
                                    courier_code: "1",
                                    rate: 120,
                                    etd: "2-3 days",
                                    serviceability_type: "surface"
                                  },
                                  {
                                    courier_name: "Delhivery",
                                    courier_code: "2",
                                    rate: 150,
                                    etd: "1-2 days",
                                    serviceability_type: "air"
                                  }
                                ];
                                
                                setCourierOptions(mockCourierOptions);
                                // Auto-select the first courier option
                                setSelectedCourier(mockCourierOptions[0].courier_code);
                                setShippingCost(mockCourierOptions[0].rate);
                                
                                toast({
                                  title: "Delivery Available",
                                  description: "We can deliver to your location.",
                                  variant: "default"
                                });
                              }}
                              className="whitespace-nowrap"
                            >
                              <MapPin className="mr-2 h-4 w-4" />
                              Check Availability
                            </Button>
                          </div>
                          
                          {selectedCourier && (
                            <div className="space-y-2">
                              <p className="font-medium">Available Shipping Options:</p>
                              <RadioGroup value={selectedCourier} onValueChange={(value) => {
                                setSelectedCourier(value);
                                const option = courierOptions.find(opt => opt.courier_code === value);
                                if (option) {
                                  setShippingCost(option.rate);
                                }
                              }}>
                                {courierOptions.map((option) => (
                                  <div key={option.courier_code} className="flex items-center space-x-2 p-2 border rounded-md">
                                    <RadioGroupItem value={option.courier_code} id={`courier-${option.courier_code}`} />
                                    <Label htmlFor={`courier-${option.courier_code}`} className="flex-grow cursor-pointer">
                                      <div className="flex justify-between items-center w-full">
                                        <div>
                                          <p className="font-medium">{option.courier_name}</p>
                                          <p className="text-sm text-gray-500">{option.etd}</p>
                                        </div>
                                        <p className="font-medium">₹{option.rate.toFixed(2)}</p>
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Payment Method</h3>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                            <div className="bg-amber-100 p-2 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 8v8" />
                                <path d="M8 12h8" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-medium">Cash on Delivery</span>
                              <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                            </div>
                          </Label>
                        <div className="flex-grow">
                          <Input
                            type="text"
                            placeholder="Enter delivery pincode"
                            value={pincode}
                            onChange={(e) => {
                              // Only allow numbers and limit to 6 digits
                              const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
                              setPincode(value);
                              
                              // Reset selection if pincode changes
                              if (value.length !== 6) {
                                setSelectedCourier('');
                                setShippingCost(0);
                                setCourierOptions([]);
                              }
                            }}
                            className="w-full"
                            maxLength={6}
                          />
                        </div>
                        <Button 
                          onClick={() => {
                            if (!pincode || pincode.length !== 6) {
                              toast({
                                title: "Invalid Pincode",
                                description: "Please enter a valid 6-digit pincode.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Directly use hardcoded shipping options
                            const mockCourierOptions = [
                              {
                                courier_name: "DTDC",
                                courier_code: "1",
                                rate: 120,
                                etd: "2-3 days",
                                serviceability_type: "surface"
                              },
                              {
                                courier_name: "Delhivery",
                                courier_code: "2",
                                rate: 150,
                                etd: "1-2 days",
                                serviceability_type: "air"
                              }
                            ];
                            
                            setCourierOptions(mockCourierOptions);
                            // Auto-select the first courier option
                            setSelectedCourier(mockCourierOptions[0].courier_code);
                            setShippingCost(mockCourierOptions[0].rate);
                            
                            toast({
                              title: "Delivery Available",
                              description: "We can deliver to your location.",
                              variant: "default"
                            });
                          }}
                          className="whitespace-nowrap"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Check Availability
                        </Button>
                      </div>
                      
                      {selectedCourier && (
                        <div className="space-y-2">
                          <p className="font-medium">Available Shipping Options:</p>
                          <RadioGroup value={selectedCourier} onValueChange={(value) => {
                            setSelectedCourier(value);
                            const option = courierOptions.find(opt => opt.courier_code === value);
                            if (option) {
                              setShippingCost(option.rate);
                            }
                          }}>
                            {courierOptions.map((option) => (
                              <div key={option.courier_code} className="flex items-center space-x-2 p-2 border rounded-md">
                                <RadioGroupItem value={option.courier_code} id={`courier-${option.courier_code}`} />
                                <Label htmlFor={`courier-${option.courier_code}`} className="flex-grow cursor-pointer">
                                  <div className="flex justify-between items-center w-full">
                                    <div>
                                      <p className="font-medium">{option.courier_name}</p>
                                      <p className="text-sm text-gray-500">{option.etd}</p>
                                    </div>
                                    <p className="font-medium">₹{option.rate.toFixed(2)}</p>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Payment Method</h3>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 8v8" />
                            <path d="M8 12h8" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium">Cash on Delivery</span>
                          <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium">Pay Online</span>
                          <p className="text-xs text-muted-foreground">Credit/Debit Cards, Net Banking, Wallets</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="upi_direct" id="upi_direct" />
                      <Label htmlFor="upi_direct" className="flex items-center gap-2 cursor-pointer">
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <path d="m8 7 4-4 4 4" />
                            <path d="M12 3v10" />
                            <path d="M8 17a4 4 0 1 0 8 0" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium">UPI Payment</span>
                          <p className="text-xs text-muted-foreground">PhonePe, Google Pay, Paytm & more</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'upi_direct' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Select UPI App</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={upiApp === 'phonepe' ? 'default' : 'outline'}
                          className="flex flex-col items-center justify-center h-20 p-2"
                          onClick={() => setUpiApp('phonepe')}
                        >
                          <img src="/images/phonepe.png" alt="PhonePe" className="h-8 w-8 mb-1" />
                          <span className="text-xs">PhonePe</span>
                        </Button>
                        <Button 
                          variant={upiApp === 'gpay' ? 'default' : 'outline'}
                          className="flex flex-col items-center justify-center h-20 p-2"
                          onClick={() => setUpiApp('gpay')}
                        >
                          <img src="/images/gpay.png" alt="Google Pay" className="h-8 w-8 mb-1" />
                          <span className="text-xs">Google Pay</span>
                        </Button>
                        <Button 
                          variant={upiApp === 'paytm' ? 'default' : 'outline'}
                          className="flex flex-col items-center justify-center h-20 p-2"
                          onClick={() => setUpiApp('paytm')}
                        >
                          <img src="/images/paytm.png" alt="Paytm" className="h-8 w-8 mb-1" />
                          <span className="text-xs">Paytm</span>
                        </Button>
                      </div>
                    </div>
                  )}
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
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="h-16 w-16 object-cover rounded-md border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.price} x {item.quantity}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">
                              Variant: {item.variant}
                            </p>
                          )}
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
                    {isCouponLoading || cartAppliedCoupon ? (
                      <div>
                        {cartAppliedCoupon ? (
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
                  <p className="font-medium">₹{totalPrice.toFixed(2)}</p>
                </div>
                
                {cartAppliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <p>Discount ({cartAppliedCoupon.discount_percent}%)</p>
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
