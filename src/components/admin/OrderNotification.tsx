
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  email?: string;
  phone?: string;
}

const OrderNotification = ({ order }: { order?: Order }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState(order?.id || '');
  const [customerName, setCustomerName] = useState(order?.customer_name || '');
  const [amount, setAmount] = useState(order?.total_amount?.toString() || '');
  const [email, setEmail] = useState(order?.email || '');
  const [phone, setPhone] = useState(order?.phone || '');
  
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (!orderId || !customerName || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields (Order ID, Customer Name, and Amount).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('sendOrderNotification', {
        body: {
          orderId,
          customerName,
          amount: parseFloat(amount),
          email,
          phone
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send notification');
      }

      toast({
        title: 'Success',
        description: 'Order notification email sent successfully',
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Send Order Notification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID*</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)*</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                type="number"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name*</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone"
              />
            </div>
          </div>
          
          <Button
            onClick={handleSendNotification}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderNotification;
