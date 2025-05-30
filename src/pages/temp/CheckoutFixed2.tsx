import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CustomerInfo } from '@/types/product';
import CheckoutForm from '@/components/checkout/CheckoutForm';

// Simplified Checkout component with essential functionality
const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, clearCart } = useCart();
  
  // Simplified state
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Handle form submission
  const handleFormSubmit = (formData: CustomerInfo) => {
    try {
      setCustomerInfo(formData);
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "There was an error processing your information.",
        variant: "destructive"
      });
    }
  };
  
  // Handle place order with simplified logic
  const handlePlaceOrder = () => {
    try {
      setIsProcessing(true);
      
      // Validate customer information
      if (!customerInfo) {
        toast({
          title: 'Error',
          description: 'Please enter your information first',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
      
      // Simulate order processing
      setTimeout(() => {
        clearCart();
        setIsProcessing(false);
        
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully!"
        });
        
        // Navigate to success page
        navigate('/order-success');
      }, 1500);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Error",
        description: "Failed to place your order. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {checkoutStep === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  onSubmit={handleFormSubmit}
                  initialValues={customerInfo}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Method</h3>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay">Pay Online (Credit/Debit Card, Wallets)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="pt-4 flex flex-wrap gap-2">
                  <Button 
                    onClick={() => setCheckoutStep(1)} 
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">₹{item.price * item.quantity}</p>
                    </div>
                  ))
                ) : (
                  <p>No items in cart</p>
                )}
                
                <Separator />
                
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p className="font-medium">₹{subtotal}</p>
                </div>
                
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p className="font-medium">₹0</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <p className="font-medium">Total</p>
                  <p className="font-medium">₹{subtotal}</p>
                </div>
                
                {customerInfo && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="font-medium">Shipping to:</p>
                      <p>{customerInfo.name}</p>
                      <p>{customerInfo.address}, {customerInfo.city}, {customerInfo.state} {customerInfo.pincode}</p>
                      <p>{customerInfo.email}</p>
                      <p>{customerInfo.phone}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
