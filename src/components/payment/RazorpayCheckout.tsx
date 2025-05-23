
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface RazorpayCheckoutProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  amount?: number;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export const RazorpayCheckout = ({ 
  onSuccess, 
  onError,
  amount: initialAmount,
  prefill 
}: RazorpayCheckoutProps) => {
  const [name, setName] = useState(prefill?.name || '');
  const [email, setEmail] = useState(prefill?.email || '');
  const [phone, setPhone] = useState(prefill?.contact || '');
  const [amount, setAmount] = useState(initialAmount || 1000); // Default ₹1000
  const [isLoading, setIsLoading] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Load Razorpay script on component mount
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        setLoadingError(null);
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          console.log('Razorpay SDK loaded successfully');
          setIsRazorpayReady(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay SDK');
          setLoadingError("Failed to load Razorpay SDK. Please check your internet connection and try again.");
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading Razorpay:', error);
        setLoadingError("Failed to load Razorpay SDK. Please ensure you're not using an ad blocker that might be blocking the script.");
      }
    };

    loadRazorpay();
    
    // Cleanup function to remove the script
    return () => {
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    } else {
      setAmount(0);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!name.trim() || !email.trim() || !phone.trim() || amount <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and ensure amount is greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating Razorpay order...');
      
      // Create an order using our Supabase edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('createRazorpayOrder', {
        body: {
          amount: amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: { 
            customerName: name, 
            customerEmail: email, 
            customerPhone: phone 
          }
        }
      });

      if (orderError || !orderData || !orderData.data || !orderData.data.id) {
        throw new Error(orderError?.message || 'Failed to create payment order');
      }

      const razorpayOrder = orderData.data;
      console.log('Order created:', razorpayOrder);

      // Get Razorpay key from env variable
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured');
      }

      console.log('Using Razorpay key:', razorpayKey);

      if (!isRazorpayReady || typeof window.Razorpay !== 'function') {
        throw new Error('Razorpay SDK is not loaded properly. Please refresh the page and try again.');
      }

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Natural Puff",
        description: "Payment for products",
        order_id: razorpayOrder.id,
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#167152", // Brand color
        },
        handler: async function(response: any) {
          console.log('Payment success response:', response);
          
          try {
            // Verify the payment with our edge function
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verifyRazorpayPayment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }
            });
            
            if (verificationError) {
              throw new Error(verificationError.message || 'Payment verification failed');
            }
            
            toast({
              title: "Payment Successful",
              description: `Payment ID: ${response.razorpay_payment_id}`,
            });
            
            if (onSuccess) onSuccess({
              ...response,
              verification: verificationData
            });
          } catch (err: any) {
            console.error('Payment verification error:', err);
            toast({
              title: "Payment Verification Failed",
              description: err.message || "There was an issue verifying your payment",
              variant: "destructive",
            });
            
            if (onError) onError(err);
          }
        },
      };

      console.log('Initializing Razorpay with options:', {...options, key: '***'});

      // Create Razorpay instance
      const razorpayInstance = new window.Razorpay(options);
      
      // Set up event listeners
      razorpayInstance.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Your payment was not successful. Please try again.",
          variant: "destructive",
        });
        if (onError) onError(response.error);
      });

      // Open Razorpay checkout
      console.log('Opening Razorpay checkout...');
      razorpayInstance.open();
    } catch (error: any) {
      console.error('Error during payment process:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Payment process failed",
        variant: "destructive",
      });
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {loadingError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Payment Gateway</AlertTitle>
            <AlertDescription>{loadingError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePayment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={handleAmountChange}
              min="1"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700 mt-2" 
            disabled={isLoading || !isRazorpayReady}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${amount}`
            )}
          </Button>
          
          {!isRazorpayReady && !loadingError && (
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading payment gateway...</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center mt-2">
            Secured by Razorpay | For testing, use card: 4111 1111 1111 1111, any future date, and any CVV
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
