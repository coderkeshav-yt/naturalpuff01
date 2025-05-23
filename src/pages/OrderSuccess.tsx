
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, AlertTriangle, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const paymentStatus = searchParams.get('payment');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  // Determine if payment failed based on URL parameter
  const isPaymentFailed = paymentStatus === 'failed';

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to retry payment for a failed order
  const retryPayment = async () => {
    if (!orderDetails) return;
    
    setRetryingPayment(true);
    try {
      // Redirect to checkout page with order ID for payment retry
      window.location.href = `/checkout?retry_order=${orderId}`;
    } catch (error) {
      console.error("Error retrying payment:", error);
      setRetryingPayment(false);
    }
  };

  return (
    <div className="container-custom py-12 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {isPaymentFailed ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-12 w-12 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-amber-700">Payment Incomplete</CardTitle>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-green-700">Order Successful!</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isPaymentFailed && (
            <Alert className="mb-4 border-amber-300 bg-amber-50">
              <AlertTitle className="text-amber-800">Payment Not Completed</AlertTitle>
              <AlertDescription className="text-amber-700">
                Your order has been created, but the payment was not completed. You can try again or choose a different payment method.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center mb-6">
            <p className="text-gray-700">
              {isPaymentFailed 
                ? "Your order has been saved but requires payment." 
                : "Thank you for your purchase! Your order has been successfully placed."}
            </p>
            {orderId && (
              <p className="text-brand-600 font-medium mt-2">
                Order ID: {orderId.substring(0, 8)}...
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
            </div>
          ) : orderDetails ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">₹{orderDetails.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {orderDetails.payment_method === 'online' 
                      ? 'Online Payment' 
                      : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium capitalize ${isPaymentFailed ? 'text-amber-600' : 'text-green-600'}`}>
                    {isPaymentFailed ? 'Payment Required' : orderDetails.status}
                  </span>
                </div>
              </div>
              
              {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Items:</h4>
                  <ul className="space-y-2">
                    {orderDetails.order_items.map((item: any) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              {isPaymentFailed 
                ? "Your order has been saved but the payment was not completed." 
                : "Your order has been placed successfully. You can check your order status in your account."}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          {isPaymentFailed ? (
            <>
              <Button 
                onClick={retryPayment} 
                disabled={retryingPayment} 
                className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
              >
                {retryingPayment ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Complete Payment
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="bg-brand-600 hover:bg-brand-700 w-full sm:w-auto">
                <Link to="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/profile">View Your Orders</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderSuccess;
