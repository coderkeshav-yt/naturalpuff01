import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DirectUpiPaymentProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DirectUpiPayment: React.FC<DirectUpiPaymentProps> = ({ 
  amount, 
  orderId,
  onSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UPI payment options
  const upiOptions = [
    { id: 'phonepe', name: 'PhonePe', upiId: 'naturalpuff@ybl', logo: '/images/phonepe.png' },
    { id: 'gpay', name: 'Google Pay', upiId: 'naturalpuff@okicici', logo: '/images/gpay.png' },
    { id: 'paytm', name: 'Paytm', upiId: 'naturalpuff@paytm', logo: '/images/paytm.png' }
  ];
  
  // Handle direct UPI payment
  const handleUpiPayment = async (upiId: string, appName: string) => {
    try {
      setIsProcessing(true);
      
      // Format amount to 2 decimal places
      const formattedAmount = amount.toFixed(2);
      
      // Generate a transaction reference
      const txnRef = `order_${orderId}_${Date.now()}`;
      
      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Payment for order #${orderId}`)}&tr=${encodeURIComponent(txnRef)}`;
      
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
          payment_attempt: JSON.stringify({
            method: 'direct_upi',
            app: appName,
            txnRef,
            timestamp: new Date().toISOString()
          })
        })
        .eq('id', orderId);
      
      // Open the UPI URL
      window.location.href = upiUrl;
      
    } catch (error) {
      console.error('Error initiating direct UPI payment:', error);
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: "Failed to initiate UPI payment. Please try another method.",
        variant: "destructive"
      });
    }
  };
  
  // Handle manual verification
  const handleVerifyManually = async () => {
    setIsProcessing(true);
    
    try {
      // Update order status to pending verification
      await supabase
        .from('orders')
        .update({
          payment_status: 'verification_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      toast({
        title: "Payment Verification Pending",
        description: "We'll verify your payment and update your order status soon.",
      });
      
      // Call success callback
      onSuccess();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to update order status. Please contact support.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>UPI Payment</CardTitle>
        <CardDescription>
          Choose your preferred UPI app to complete the payment of ₹{amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {upiOptions.map(option => (
            <Button
              key={option.id}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2"
              disabled={isProcessing}
              onClick={() => handleUpiPayment(option.upiId, option.name)}
            >
              <div className="w-10 h-10 mb-2 bg-contain bg-center bg-no-repeat" 
                style={{ backgroundImage: `url(${option.logo})` }} />
              <span className="text-xs">{option.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          <p>After completing payment in your UPI app, please click the button below:</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handleVerifyManually} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "I've Completed Payment"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectUpiPayment;
