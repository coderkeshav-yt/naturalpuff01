import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DirectUpiHandlerProps {
  orderId: string;
  amount: number;
  customerName: string;
  onComplete: () => void;
}

const DirectUpiHandler: React.FC<DirectUpiHandlerProps> = ({
  orderId,
  amount,
  customerName,
  onComplete
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
      
      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId} - ${customerName}`)}&tr=${encodeURIComponent(txnRef)}`;
      
      console.log(`Opening ${appName} payment with URL:`, upiUrl);
      
      // Store payment info in localStorage for verification after return
      localStorage.setItem('np_current_payment', JSON.stringify({
        orderId,
        amount: formattedAmount,
        txnRef,
        timestamp: Date.now(),
        paymentApp: appName
      }));
      
      // Update order with payment attempt info
      await supabase
        .from('orders')
        .update({
          payment_method: 'upi_direct',
          payment_status: 'initiated',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      // Open the UPI URL
      window.location.href = upiUrl;
      
    } catch (error) {
      console.error('Error initiating UPI payment:', error);
      alert('Failed to open UPI payment app. Please try another payment method.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Choose UPI App</h3>
      
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
