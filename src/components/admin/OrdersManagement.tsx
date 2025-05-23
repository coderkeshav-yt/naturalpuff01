
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OrderDetailsDialog from './OrderDetailsDialog';

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

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // For each order, get the user details and order items
      const orderPromises = ordersData.map(async (order: Order) => {
        // Get order items
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;

        // Get user details if user_id exists
        let userName = 'Guest';
        let userEmail = 'N/A';

        if (order.user_id) {
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', order.user_id)
            .single();

          if (profileData) {
            userName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'User';
          }

          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(
            order.user_id
          );

          if (userData?.user?.email) {
            userEmail = userData.user.email;
          }
        } else if (order.shipping_address) {
          // For guest orders, use shipping address name and email
          try {
            const address = typeof order.shipping_address === 'string' 
              ? JSON.parse(order.shipping_address) 
              : order.shipping_address;
              
            userName = address.name || 'Guest';
            userEmail = address.email || 'N/A';
          } catch (e) {
            console.error('Error parsing shipping address', e);
          }
        }

        // Return enhanced order
        return {
          ...order,
          customer_name: userName,
          customer_email: userEmail,
          items: orderItems || [],
        };
      });

      // Wait for all promises to resolve
      const enhancedOrders = await Promise.all(orderPromises);
      setOrders(enhancedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load orders',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter to show most recent orders first
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Order Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No orders available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>₹{order.total_amount}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          disabled={isUpdating}
                          value={order.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(order.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Update Status" />
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
                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(order)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {selectedOrder && (
        <OrderDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          order={selectedOrder}
          onStatusUpdate={(status) =>
            handleUpdateStatus(selectedOrder.id, status)
          }
        />
      )}
    </Card>
  );
};

export default OrdersManagement;
