
import React, { useState } from 'react';
import { RazorpayCheckout } from '@/components/payment/RazorpayCheckout';
import { fullWidthContainer } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Payment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Get payment details from location state if available
  const paymentDetails = location.state?.paymentDetails || {};
  const amount = paymentDetails.amount || 0;
  const orderId = paymentDetails.orderId;
  
  const handlePaymentSuccess = async (response: any) => {
    console.log('Payment successful:', response);
    setPaymentSuccess(true);
    
    try {
      // If we have an order ID, update the order with payment details
      if (orderId) {
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_id: response.razorpay_payment_id,
            status: 'paid'
          })
          .eq('id', orderId);
        
        if (error) {
          console.error('Failed to update order:', error);
          toast({
            title: "Order Update Failed",
            description: "Your payment was successful, but we couldn't update your order status. Our team will fix this soon.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Payment Successful",
        description: `Your payment was processed successfully. Payment ID: ${response.razorpay_payment_id}`,
      });
      
      // Redirect to success page after a short delay
      setTimeout(() => {
        navigate('/order-success', { 
          state: { 
            paymentId: response.razorpay_payment_id,
            orderId: orderId || 'N/A'
          } 
        });
      }, 1500);
    } catch (error) {
      console.error('Error in payment success handler:', error);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    toast({
      title: "Payment Failed",
      description: error.error?.description || "There was an issue with your payment. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className={`py-12 ${fullWidthContainer}`}>
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-center mb-6 font-playfair text-brand-800">
          Make a Payment
        </h1>
        
        {paymentSuccess ? (
          <Alert className="max-w-md mx-auto mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Payment Successful</AlertTitle>
            <AlertDescription className="text-green-600">
              Your payment has been processed successfully. Redirecting you to the confirmation page...
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="max-w-md mx-auto mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              This is a test payment gateway. Use card number 4111 1111 1111 1111 with any future expiry date and any CVV.
            </AlertDescription>
          </Alert>
        )}
        
        {!paymentSuccess && (
          <div className="max-w-md mx-auto">
            <RazorpayCheckout 
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              amount={amount > 0 ? amount : undefined}
              prefill={{
                name: user?.user_metadata?.full_name,
                email: user?.email,
                contact: user?.user_metadata?.phone
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
