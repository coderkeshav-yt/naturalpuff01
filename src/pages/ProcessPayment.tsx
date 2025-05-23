import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// This is a dedicated page that does only one thing: process Razorpay payment
// It's designed to be navigated to from Checkout with order details in query params
const ProcessPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Parse order details from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    
    if (!orderId || !amount) {
      setError('Missing order information. Please go back to checkout.');
      setIsLoading(false);
      return;
    }
    
    setOrderDetails({
      orderId,
      amount: parseFloat(amount),
    });
    
    // Immediately start the payment process
    processPayment(orderId, parseFloat(amount));
  }, [location]);

  // Handle successful payment
  const handlePaymentSuccess = async (response: any, orderId: string) => {
    try {
      console.log('Payment success:', response);
      
      // Verify the payment signature server-side
      const { data, error } = await supabase.functions.invoke('verifyRazorpayPayment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_id: orderId
        }
      });
      
      if (error) {
        console.error('Payment verification error:', error);
        throw new Error('Payment verification failed. Please contact support.');
      }
      
      // Update order status
      await updateOrderPaymentStatus(orderId, 'paid');
      
      // Success notification
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
      
      // Redirect to success page
      navigate(`/order-success?id=${orderId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An error occurred processing your payment.",
        variant: "destructive"
      });
      
      // Still redirect to order success but with payment=failed
      navigate(`/order-success?id=${orderId}&payment=failed`);
    }
  };

  // Update order payment status
  const updateOrderPaymentStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: status === 'paid' ? 'processing' : 'payment_failed' })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
      }
    } catch (updateError) {
      console.error('Failed to update order status:', updateError);
    }
  };

  // Process payment with Razorpay
  const processPayment = async (orderId: string, amount: number) => {
    setIsLoading(true);
    
    try {
      console.log('Processing payment for order:', orderId, 'amount:', amount);
      
      // 1. Load Razorpay script directly
      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) {
          console.log('Razorpay already loaded');
          resolve();
          return;
        }
        
        console.log('Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          resolve();
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          reject(new Error('Failed to load payment gateway. Please check your internet connection.'));
        };
        
        document.body.appendChild(script);
      });
      
      // 2. Create Razorpay order
      console.log('Creating Razorpay order...');
      const { data, error } = await supabase.functions.invoke('createRazorpayOrder', {
        body: {
          amount: Math.round(amount * 100), // Convert to paise
          currency: 'INR',
          receipt: `order_${orderId}`,
          notes: { order_id: orderId }
        }
      });
      
      if (error || !data || !data.data || !data.data.id) {
        throw new Error(`Failed to create payment order: ${error?.message || 'Unknown error'}`);
      }
      
      console.log('Razorpay order created:', data.data.id);
      
      // Get customer info from the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('shipping_address')
        .eq('id', orderId)
        .single();
      
      if (orderError || !orderData) {
        console.error('Error fetching order details:', orderError);
        throw new Error('Could not retrieve customer information');
      }
      
      const customerInfo = orderData.shipping_address;
      
      // 3. Open Razorpay checkout
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment gateway configuration is missing');
      }
      
      const options = {
        key: razorpayKey,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'Natural Puff',
        description: `Payment for Order #${orderId}`,
        order_id: data.data.id,
        prefill: {
          name: customerInfo.name || '',
          email: customerInfo.email || '',
          contact: customerInfo.phone || '',
        },
        theme: {
          color: '#167152',
        },
        handler: function(response: any) {
          handlePaymentSuccess(response, orderId);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment window closed by user');
            updateOrderPaymentStatus(orderId, 'payment_failed');
            navigate(`/order-success?id=${orderId}&payment=failed`);
          }
        }
      };
      
      console.log('Opening Razorpay checkout...');
      
      // Create Razorpay instance
      const razorpay = new window.Razorpay(options);
      
      // Add payment failure handler
      razorpay.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        updateOrderPaymentStatus(orderId, 'payment_failed');
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Your payment could not be processed. Please try again.",
          variant: "destructive"
        });
        navigate(`/order-success?id=${orderId}&payment=failed`);
      });
      
      // Open payment window with a delay to ensure everything is ready
      setTimeout(() => {
        try {
          razorpay.open();
          console.log('Razorpay checkout window opened');
          setIsLoading(false);
        } catch (openError) {
          console.error('Error opening payment window:', openError);
          setError('Failed to open payment window. Please try again.');
          setIsLoading(false);
          
          // Redirect to order success with payment failed
          navigate(`/order-success?id=${orderId}&payment=failed`);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred processing your payment');
      setIsLoading(false);
      
      // Redirect to order success with payment failed
      navigate(`/order-success?id=${orderId}&payment=failed`);
    }
  };

  // If payment can't be processed, allow user to try again or go to order page
  const handleRetry = () => {
    if (orderDetails) {
      processPayment(orderDetails.orderId, orderDetails.amount);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-6">Processing Your Payment</h1>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
            <p>Please wait while we connect to the payment gateway...</p>
            <p className="text-sm text-gray-500">Do not close this window or refresh the page</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <p className="font-medium">Payment Error</p>
              <p>{error}</p>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/order-success?id=${orderDetails?.orderId}&payment=failed`)}
              >
                View Order
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <p>Payment window should open automatically. If it doesn't, please click the button below.</p>
        )}
        
        {!isLoading && !error && (
          <Button 
            onClick={handleRetry} 
            className="mt-4 bg-brand-600 hover:bg-brand-700"
          >
            Open Payment Window
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProcessPayment;
