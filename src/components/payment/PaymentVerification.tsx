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
    
    // Clear payment_in_progress flag to prevent getting stuck
    localStorage.removeItem('payment_in_progress');
    
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
        const statusParam = searchParams.get('Status') || searchParams.get('status'); // Some UPI apps return Status
        
        // Check if we have a stored payment in localStorage or sessionStorage
        let storedPaymentData = localStorage.getItem('np_current_payment');
        
        // If not in localStorage, try sessionStorage as backup
        if (!storedPaymentData) {
          storedPaymentData = sessionStorage.getItem('np_current_payment');
          console.log('Using payment data from sessionStorage');
        }
        
        let storedOrderId = null;
        let paymentTimestamp = null;
        
        if (storedPaymentData) {
          try {
            const paymentData = JSON.parse(storedPaymentData);
            storedOrderId = paymentData.orderId;
            paymentTimestamp = paymentData.timestamp;
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
        
        // Check if the UPI app returned a status parameter
        if (statusParam) {
          console.log('UPI app returned status:', statusParam);
          // Some UPI apps return SUCCESS or FAILURE directly
          if (statusParam.toUpperCase() === 'SUCCESS') {
            console.log('UPI app reported successful payment');
            // We'll still verify with server, but this is a good sign
          } else if (statusParam.toUpperCase() === 'FAILURE' || statusParam.toUpperCase() === 'FAILED') {
            console.log('UPI app reported failed payment');
            // We'll still verify with server to be sure
          }
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
        
        // Implement multiple verification attempts for UPI payments
        // This is crucial for mobile UPI payments as they may take time to reflect
        let verificationAttempts = 0;
        const maxVerificationAttempts = 3;
        const verificationInterval = 5000; // 5 seconds between attempts
        
        const attemptVerification = () => {
          verificationAttempts++;
          console.log(`Payment verification attempt ${verificationAttempts} of ${maxVerificationAttempts}`);
          
          // Check payment status with server
          checkPaymentStatus(
            paymentOrderId,
            (response) => {
              // Success callback
              console.log('Payment verification successful:', response);
              setVerificationResult('success');
              
              // Clear payment data from both storage types
              localStorage.removeItem('np_current_payment');
              localStorage.removeItem('current_order_id');
              sessionStorage.removeItem('np_current_payment');
              localStorage.removeItem('payment_in_progress');
              
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
              console.error(`Payment verification attempt ${verificationAttempts} failed:`, error);
              
              // If we haven't reached max attempts, try again
              if (verificationAttempts < maxVerificationAttempts) {
                console.log(`Will retry verification in ${verificationInterval/1000} seconds...`);
                setTimeout(attemptVerification, verificationInterval);
              } else {
                // All attempts failed
                console.log('All verification attempts failed');
                setVerificationResult('failed');
                
                // Clear payment data
                localStorage.removeItem('payment_in_progress');
                
                toast({
                  title: "Payment Verification Failed",
                  description: "We couldn't verify your payment after multiple attempts. Please check your payment app or contact support.",
                  variant: "destructive"
                });
              }
            }
          );
        };
        
        // Start the verification process
        attemptVerification();
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
