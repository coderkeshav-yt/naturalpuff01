import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface UpiQrPaymentProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const UpiQrPayment: React.FC<UpiQrPaymentProps> = ({ 
  amount, 
  orderId,
  onSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle manual verification
  const handleVerifyManually = async () => {
    setIsProcessing(true);
    
    try {
      // Update order status to pending verification
      await supabase
        .from('orders')
        .update({
          status: 'pending',
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
  
  // Generate UPI QR code URL
  const upiId = "naturalpuff@ybl"; // Replace with your actual UPI ID
  const formattedAmount = amount.toFixed(2);
  const qrCodeUrl = `https://upiqr.in/api/qr?name=Natural%20Puff&vpa=${encodeURIComponent(upiId)}&amount=${formattedAmount}&tr=${encodeURIComponent(orderId)}`;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Pay ₹{formattedAmount} via UPI</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="w-64 h-64 mb-4">
          <img 
            src={qrCodeUrl} 
            alt="UPI QR Code" 
            className="w-full h-full"
          />
        </div>
        
        <div className="text-center mb-4">
          <p className="font-medium">UPI ID: {upiId}</p>
          <p className="text-sm text-gray-500 mt-2">
            Scan this QR code with any UPI app (PhonePe, Google Pay, Paytm, etc.)
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <a 
            href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`}
            className="flex flex-col items-center justify-center p-3 border rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/phonepe.png" alt="PhonePe" className="w-10 h-10 mb-2" />
            <span className="text-xs">PhonePe</span>
          </a>
          
          <a 
            href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`}
            className="flex flex-col items-center justify-center p-3 border rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/gpay.png" alt="Google Pay" className="w-10 h-10 mb-2" />
            <span className="text-xs">Google Pay</span>
          </a>
          
          <a 
            href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`}
            className="flex flex-col items-center justify-center p-3 border rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/paytm.png" alt="Paytm" className="w-10 h-10 mb-2" />
            <span className="text-xs">Paytm</span>
          </a>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handleVerifyManually} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "I've Completed Payment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UpiQrPayment;
