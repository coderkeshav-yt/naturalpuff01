import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { checkPaymentStatus } from '@/services/razorpayService';

interface PaymentVerificationProps {
  onComplete?: () => void;
}

const PaymentVerification: React.FC<PaymentVerificationProps> = ({ onComplete }) => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const verifyPayment = async () => {
      try {
        setIsVerifying(true);
        
        // Check for Razorpay parameters in URL
        const razorpayPaymentId = searchParams.get('razorpay_payment_id');
        const razorpayOrderId = searchParams.get('razorpay_order_id');
        const razorpaySignature = searchParams.get('razorpay_signature');
        
        // Check for UPI return parameters
        const paymentId = searchParams.get('payment_id') || razorpayPaymentId;
        const orderIdParam = searchParams.get('order_id');
        
        // Check if we have a stored payment in localStorage
        const storedPaymentData = localStorage.getItem('np_current_payment');
        let storedOrderId = null;
        
        if (storedPaymentData) {
          try {
            const paymentData = JSON.parse(storedPaymentData);
            storedOrderId = paymentData.orderId;
            console.log('Found stored payment data:', paymentData);
          } catch (e) {
            console.error('Error parsing stored payment data:', e);
          }
        }
        
        // Determine the order ID from various sources
        const paymentOrderId = orderIdParam || storedOrderId || localStorage.getItem('current_order_id');
        
        if (!paymentOrderId) {
          console.error('No order ID found for verification');
          setVerificationResult('failed');
          setIsVerifying(false);
          toast({
            title: "Verification Failed",
            description: "Could not find order information. Please contact support.",
            variant: "destructive"
          });
          return;
        }
        
        setOrderId(paymentOrderId);
        console.log('Verifying payment for order:', paymentOrderId);
        
        // If we have Razorpay parameters, we can consider it successful
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
          console.log('Razorpay parameters found in URL, payment successful');
          
          // Update order status in database
          await supabase
            .from('orders')
            .update({
              payment_id: razorpayPaymentId,
              payment_status: 'paid',
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentOrderId);
            
          setVerificationResult('success');
          
          // Clear payment data
          localStorage.removeItem('np_current_payment');
          localStorage.removeItem('current_order_id');
          
          toast({
            title: "Payment Successful",
            description: "Your payment was successful and your order is being processed.",
          });
          
          // Redirect to order success page
          setTimeout(() => {
            navigate(`/order-success?id=${paymentOrderId}`);
          }, 2000);
          
          return;
        }
        
        // For UPI payments or when returning from payment app without parameters
        // We need to check with the server
        console.log('No Razorpay parameters found, checking payment status with server...');
        
        // Check payment status with server
        checkPaymentStatus(
          paymentOrderId,
          (response) => {
            // Success callback
            console.log('Payment verification successful:', response);
            setVerificationResult('success');
            
            // Clear payment data
            localStorage.removeItem('np_current_payment');
            localStorage.removeItem('current_order_id');
            
            toast({
              title: "Payment Successful",
              description: "Your payment was successful and your order is being processed.",
            });
            
            // Redirect to order success page
            setTimeout(() => {
              navigate(`/order-success?id=${paymentOrderId}`);
            }, 2000);
          },
          (error) => {
            // Failure callback
            console.error('Payment verification failed:', error);
            setVerificationResult('failed');
            
            toast({
              title: "Payment Verification Failed",
              description: "We couldn't verify your payment. Please check your payment app or contact support.",
              variant: "destructive"
            });
          }
        );
      } catch (error) {
        console.error('Error during payment verification:', error);
        setVerificationResult('failed');
        toast({
          title: "Verification Error",
          description: "An error occurred during payment verification. Please contact support.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [searchParams, navigate, toast]);
  
  const handleRetry = () => {
    if (orderId) {
      navigate(`/checkout?retry=${orderId}`);
    } else {
      navigate('/checkout');
    }
  };
  
  const handleContinueShopping = () => {
    navigate('/');
  };
  
  return (
    <div className="container-custom py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Payment Verification</h1>
        
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-center">Verifying your payment...</p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              This may take a few moments. Please do not close this page.
            </p>
          </div>
        ) : verificationResult === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Payment Successful!</h2>
            <p className="text-center text-muted-foreground mb-6">
              Your payment has been processed successfully. You will be redirected to the order confirmation page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Payment Verification Failed</h2>
            <p className="text-center text-muted-foreground mb-6">
              We couldn't verify your payment. This could be because:
            </p>
            <ul className="list-disc pl-6 mb-6 text-sm text-muted-foreground">
              <li>Your payment is still being processed</li>
              <li>The payment was cancelled or failed</li>
              <li>There was a network issue during verification</li>
            </ul>
            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleRetry} className="w-full">
                Try Payment Again
              </Button>
              <Button variant="outline" onClick={handleContinueShopping} className="w-full">
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification;
