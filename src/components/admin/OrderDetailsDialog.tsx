
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string | null;
  total_amount: number;
  shipping_address: any;
  status: string;
  created_at: string;
  payment_id?: string;
  shipping_details?: any;
  customer_email?: string;
  customer_name?: string;
  items?: OrderItem[];
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onStatusUpdate: (status: string) => void;
}

const OrderDetailsDialog = ({ 
  open, 
  onOpenChange, 
  order, 
  onStatusUpdate
}: OrderDetailsDialogProps) => {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-indigo-100 text-indigo-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Parse shipping address from string or object
  const parseShippingAddress = () => {
    if (!order.shipping_address) return 'No address provided';
    
    try {
      const address = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;
      
      // Format varies based on checkout type (guest or logged in)
      if (address.firstName) {
        // Guest checkout
        return `${address.firstName} ${address.lastName}
${address.address}
${address.city}, ${address.state} ${address.pincode}
${address.phone}`;
      } else {
        // Standard address
        return address.address || 'Address not provided';
      }
    } catch (e) {
      console.error('Error parsing shipping address', e);
      return 'Error parsing address';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Order Details #{order.id.substring(0, 8)}...</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Order Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Order Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Order Date</div>
              <div>{formatDate(order.created_at)}</div>
              
              <div className="font-medium">Payment ID</div>
              <div>{order.payment_id || 'N/A'}</div>
              
              <div className="font-medium">Payment Method</div>
              <div>{order.payment_id ? 'Online' : 'COD'}</div>
              
              <div className="font-medium">Status</div>
              <div>
                <Select 
                  value={order.status} 
                  onValueChange={(value) => onStatusUpdate(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="font-medium">Total Amount</div>
              <div className="font-semibold">₹{order.total_amount}</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="font-medium">Name</div>
              <div>{order.customer_name || 'N/A'}</div>
              
              <div className="font-medium">Email</div>
              <div>{order.customer_email || 'N/A'}</div>
              
              <div className="font-medium">Shipping Address</div>
              <div className="whitespace-pre-line">{parseShippingAddress()}</div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Order Items */}
        <div className="py-4">
          <h3 className="font-semibold text-lg mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">₹{item.price}</td>
                    <td className="py-2 text-right">₹{item.price * item.quantity}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={3} className="py-2 text-right">Total</td>
                  <td className="py-2 text-right">₹{order.total_amount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Shipping Details */}
        {order.shipping_details && (
          <>
            <Separator />
            <div className="py-4">
              <h3 className="font-semibold text-lg mb-4">Shipping Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Shiprocket Order ID</div>
                <div>{order.shipping_details.shiprocket_order_id || 'N/A'}</div>
                
                <div className="font-medium">Shipment ID</div>
                <div>{order.shipping_details.shiprocket_shipment_id || 'N/A'}</div>
                
                {order.shipping_details.tracking_url && (
                  <>
                    <div className="font-medium">Tracking</div>
                    <div>
                      <a 
                        href={order.shipping_details.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Track Package
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="mt-2"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
