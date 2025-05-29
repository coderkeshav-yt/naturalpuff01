
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { CustomerInfo } from '@/types/product';
import { ShiprocketService } from '@/services/shiprocket';

interface ShiprocketPaymentProps {
  orderId: string;
  amount: number;
  customerInfo: CustomerInfo;
  onSuccess: () => void;
}

const ShiprocketPayment = ({ orderId, amount, customerInfo, onSuccess }: ShiprocketPaymentProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePaymentLink = async () => {
    setIsGenerating(true);
    try {
      // Generate payment link via Shiprocket Service
      const paymentData = await ShiprocketService.generatePaymentLink({
        order_id: orderId,
        amount: amount,
        purpose: 'Natural Puff Order Payment',
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
      });

      if (!paymentData || !paymentData.payment_url) {
        throw new Error('No payment URL received');
      }
      
      // Update order with payment link info in Supabase
      const { error: updateError } = await ShiprocketService.updateOrderPaymentDetails(orderId, {
        payment_link_id: paymentData.id,
        payment_url: paymentData.payment_url,
        status: 'pending'
      });

      if (updateError) {
        console.error('Error updating order payment details:', updateError);
      }

      // Redirect to payment page
      window.location.href = paymentData.payment_url;
    } catch (error: any) {
      console.error('Payment link generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payment link',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePaymentLink}
      disabled={isGenerating}
      className="w-full bg-brand-600 hover:bg-brand-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Payment Link...
        </>
      ) : (
        'Pay Now'
      )}
    </Button>
  );
};

export default ShiprocketPayment;
