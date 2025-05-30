import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

import { CustomerInfo } from '@/types/product';

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

  // Handle UPI app payment
  const handleUpiPayment = async (upiId: string, appName: string) => {
    try {
      // Format amount to 2 decimal places
      const formattedAmount = amount.toFixed(2);
      
      // Generate a transaction reference
      const txnRef = `order_${orderId}_${Date.now()}`;
      
      // Create UPI payment URL with callback URL for automatic verification
      // The callback URL will help with automatic verification when user returns from UPI app
      const callbackUrl = encodeURIComponent(`${window.location.origin}/payment-verification?order_id=${orderId}`);
      
      // Create UPI payment URL with callback parameters
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId} - ${customerInfo.name}`)}&tr=${encodeURIComponent(txnRef)}&url=${callbackUrl}`;
      
      console.log(`Opening ${appName} payment with URL:`, upiUrl);
      
      // Store payment info in localStorage for verification after return
      localStorage.setItem('np_current_payment', JSON.stringify({
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
      }));
      
      // Also store in sessionStorage as a backup (localStorage might be cleared in some mobile browsers)
      sessionStorage.setItem('np_current_payment', JSON.stringify({
        orderId,
        amount: formattedAmount,
        txnRef,
        timestamp: Date.now(),
        paymentApp: appName
      }));
      
      // Set a flag to indicate payment is in progress
      localStorage.setItem('payment_in_progress', 'true');
      
      // Update order with payment attempt info
      try {
        await supabase
          .from('orders')
          .update({
            status: 'payment_initiated',
            payment_id: txnRef,
            payment_app: appName,
            payment_attempt_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (dbError) {
        console.error('Error updating order status:', dbError);
        // Continue with payment even if DB update fails
      }
      
      // Set a safety timeout that will redirect to verification page if user gets stuck
      // This is crucial for mobile UPI payments that don't properly redirect back
      const safetyTimeout = setTimeout(() => {
        // If we're still on the same page after 30 seconds, redirect to verification
        if (document.visibilityState === 'visible') {
          console.log('Safety timeout triggered - redirecting to verification page');
          window.location.href = `${window.location.origin}/payment-verification?order_id=${orderId}`;
        }
      }, 30000); // 30 seconds timeout
      
      // Store the timeout ID so it can be cleared if needed
      localStorage.setItem('upi_safety_timeout', safetyTimeout.toString());
      
      // Open the UPI URL
      window.location.href = upiUrl;
      
    } catch (error) {
      console.error('Error initiating UPI payment:', error);
      alert('Failed to open UPI payment app. Please try another payment method.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Choose UPI App</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <span className="text-sm">Cancel</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {upiOptions.map(option => (
          <Button
            key={option.id}
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => handleUpiPayment(option.upiId, option.name)}
          >
            <span className="text-sm">{option.name}</span>
          </Button>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 mt-4 text-center">
        <p>After completing payment, you'll be redirected back to the order confirmation page.</p>
      </div>
    </div>
  );
};

export default DirectUpiHandler;
