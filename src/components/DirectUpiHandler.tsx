import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { CustomerInfo } from '@/types/product';

interface PaymentAttempt {
  orderId: string;
  amount: string;
  txnRef: string;
  timestamp: number;
  paymentApp: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface DirectUpiHandlerProps {
  orderId: string;
  amount: number;
  customerInfo: CustomerInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

const DirectUpiHandler: React.FC<DirectUpiHandlerProps> = ({
  orderId,
  amount,
  customerInfo,
  onSuccess,
  onCancel
}) => {
  // UPI payment options with their IDs
  const upiOptions = [
    { id: 'phonepe', name: 'PhonePe', upiId: 'naturalpuff@ybl' },
    { id: 'gpay', name: 'Google Pay', upiId: 'naturalpuff@okicici' },
    { id: 'paytm', name: 'Paytm', upiId: 'naturalpuff@paytm' }
  ];

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<string | null>(null);
  const [safetyTimeout, setSafetyTimeout] = React.useState<NodeJS.Timeout | null>(null);

  // Cleanup function to clear timeouts and event listeners
  useEffect(() => {
    return () => {
      // Clear any active timeouts
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [safetyTimeout]);

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Only show warning if payment is in progress
    if (isProcessing) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };

  const storePaymentData = (data: PaymentAttempt) => {
    try {
      localStorage.setItem('np_current_payment', JSON.stringify(data));
      sessionStorage.setItem('np_current_payment', JSON.stringify(data));
      localStorage.setItem('payment_in_progress', 'true');
    } catch (error) {
      console.error('Error storing payment data:', error);
      throw new Error('Failed to store payment information. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId: string, txnRef: string, appName: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'payment_initiated',
          payment_id: txnRef,
          payment_app: appName,
          payment_attempt_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      // Don't block the payment flow for DB errors
    }
  };

  // Handle UPI app payment
  const handleUpiPayment = async (upiId: string, appName: string) => {
    setIsProcessing(true);
    setSelectedApp(appName);
    
    try {
      // Format amount to 2 decimal places
      const formattedAmount = amount.toFixed(2);
      
      // Generate a transaction reference
      const txnRef = `order_${orderId}_${Date.now()}`;
      
      // Create UPI payment URL with callback URL for automatic verification
      const callbackUrl = encodeURIComponent(
        `${window.location.origin}/payment-verification?order_id=${orderId}&txn_ref=${txnRef}`
      );
      
      // Create UPI payment URL with callback parameters
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}` +
        `&pn=NaturalPuff` +
        `&am=${formattedAmount}` +
        `&cu=INR` +
        `&tn=${encodeURIComponent(`Order ${orderId} - ${customerInfo.name}`)}` +
        `&tr=${encodeURIComponent(txnRef)}` +
        `&url=${callbackUrl}`;
      
      console.log(`Initiating ${appName} payment with URL:`, upiUrl);
      
      // Prepare payment data
      const paymentData: PaymentAttempt = {
        orderId,
        amount: formattedAmount,
        txnRef,
        timestamp: Date.now(),
        paymentApp: appName,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        }
      };
      
      // Store payment data
      storePaymentData(paymentData);
      
      // Update order status
      await updateOrderStatus(orderId, txnRef, appName);
      
      // Add beforeunload listener
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Set a safety timeout that will redirect to verification page if user gets stuck
      const timeout = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          console.log('Safety timeout triggered - redirecting to verification page');
          window.location.href = `${window.location.origin}/payment-verification?order_id=${orderId}&txn_ref=${txnRef}`;
        }
      }, 30000); // 30 seconds timeout
      
      setSafetyTimeout(timeout);
      localStorage.setItem('upi_safety_timeout', timeout.toString());
      
      // Open the UPI URL
      window.location.href = upiUrl;
      
    } catch (error) {
      console.error('Error initiating UPI payment:', error);
      setIsProcessing(false);
      setSelectedApp(null);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to open UPI payment app. Please try another payment method.'
      );
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Choose UPI App</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          <span className="text-sm">Cancel</span>
        </Button>
      </div>
      
      {isProcessing && selectedApp ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-gray-700 mb-2">
            Opening {selectedApp}...
          </p>
          <p className="text-sm text-gray-500 text-center">
            If {selectedApp} doesn't open automatically, please tap the notification or open it manually.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {upiOptions.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className={`flex flex-col items-center justify-center h-20 p-2 transition-all ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => !isProcessing && handleUpiPayment(option.upiId, option.name)}
                disabled={isProcessing}
              >
                <img 
                  src={`/icons/upi-${option.id}.png`} 
                  alt={option.name} 
                  className="h-8 w-8 mb-1 object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-sm font-medium mt-1">{option.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="text-sm text-gray-500 mt-4 text-center space-y-2">
            <p>After completing payment, you'll be redirected back to the order confirmation page.</p>
            <p className="text-xs text-muted-foreground">
              Payment processing is secure and powered by Razorpay UPI
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default DirectUpiHandler;
