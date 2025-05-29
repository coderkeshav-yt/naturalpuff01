import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Package, Truck, FileText, Printer, AlertTriangle, RefreshCw } from 'lucide-react';
import { ShiprocketService } from '@/services/shiprocket';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentOrder {
  id: string;
  order_id: string;
  customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
  shipping_details: {
    shiprocket_order_id?: string;
    shiprocket_shipment_id?: string;
    tracking_url?: string;
    courier_name?: string;
    courier_id?: string;
    status?: string;
  };
  order_items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  order_total: number;
}

const statusColors: Record<string, string> = {
  'CREATED': 'bg-blue-100 text-blue-800',
  'PICKUP': 'bg-indigo-100 text-indigo-800',
  'SHIPPED': 'bg-purple-100 text-purple-800',
  'IN_TRANSIT': 'bg-amber-100 text-amber-800',
  'DELIVERED': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
  'PENDING': 'bg-gray-100 text-gray-800',
};

const ShiprocketManager = () => {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ShipmentOrder | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending' && (!order.shipping_details || !order.shipping_details.shiprocket_order_id)) return true;
    if (activeTab === 'processing' && order.shipping_details?.status && ['CREATED', 'PICKUP'].includes(order.shipping_details.status)) return true;
    if (activeTab === 'shipped' && order.shipping_details?.status && ['SHIPPED', 'IN_TRANSIT'].includes(order.shipping_details.status)) return true;
    if (activeTab === 'delivered' && order.shipping_details?.status === 'DELIVERED') return true;
    if (activeTab === 'cancelled' && order.shipping_details?.status === 'CANCELLED') return true;
    return false;
  });

  const handleCreateShipment = async (order: ShipmentOrder) => {
    setIsActionLoading(true);
    try {
      // Format order data for Shiprocket
      const orderData = {
        order_db_id: order.id,
        order_id: `NP-${order.id}`,
        order_date: new Date(order.created_at).toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: order.customer_name,
        billing_address: order.shipping_address,
        billing_city: order.shipping_city,
        billing_state: order.shipping_state,
        billing_country: 'India',
        billing_pincode: order.shipping_pincode,
        billing_email: 'customer@example.com', // Replace with actual email
        billing_phone: '9999999999', // Replace with actual phone
        shipping_is_billing: true,
        order_items: order.order_items.map(item => ({
          name: item.name,
          sku: `SKU-${item.name.substring(0, 5)}`,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
        })),
        payment_method: 'Prepaid',
        sub_total: order.order_total,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      };

      const result = await ShiprocketService.createOrder(orderData);
      
      if (result && result.order_id) {
        toast({
          title: 'Success',
          description: 'Shipment created successfully',
        });
        fetchOrders(); // Refresh orders
      } else {
        throw new Error('Failed to create shipment');
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shipment',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateLabel = async (shipmentId: string) => {
    setIsActionLoading(true);
    try {
      const result = await ShiprocketService.generateLabel(shipmentId);
      
      if (result && result.label_url) {
        // Open label in new tab
        window.open(result.label_url, '_blank');
      } else {
        throw new Error('Failed to generate label');
      }
    } catch (error: any) {
      console.error('Error generating label:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate label',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setIsActionLoading(true);
    try {
      const result = await ShiprocketService.generateInvoice(orderId);
      
      if (result && result.invoice_url) {
        // Open invoice in new tab
        window.open(result.invoice_url, '_blank');
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelShipment = async (orderId: string, shipmentId?: string) => {
    setIsActionLoading(true);
    try {
      const result = await ShiprocketService.cancelOrder(orderId, shipmentId);
      
      if (result && (result.success || result.status === 200)) {
        toast({
          title: 'Success',
          description: 'Shipment cancelled successfully',
        });
        fetchOrders(); // Refresh orders
      } else {
        throw new Error('Failed to cancel shipment');
      }
    } catch (error: any) {
      console.error('Error cancelling shipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel shipment',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shiprocket Shipment Manager
          </CardTitle>
          <Button 
            onClick={fetchOrders} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">NP-{order.id.substring(0, 8)}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          {order.shipping_details?.status ? (
                            <Badge className={statusColors[order.shipping_details.status] || 'bg-gray-100'}>
                              {order.shipping_details.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>₹{order.order_total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!order.shipping_details?.shiprocket_order_id ? (
                              <Button 
                                size="sm" 
                                onClick={() => handleCreateShipment(order)}
                                disabled={isActionLoading}
                              >
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                                <span className="ml-1">Create</span>
                              </Button>
                            ) : (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                      <Truck className="h-4 w-4" />
                                      <span className="ml-1 hidden md:inline">Details</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Shipment Details</DialogTitle>
                                    </DialogHeader>
                                    {selectedOrder && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-gray-500">Order ID</p>
                                            <p className="font-medium">NP-{selectedOrder.id}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-500">Shiprocket Order ID</p>
                                            <p className="font-medium">{selectedOrder.shipping_details?.shiprocket_order_id || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-500">Shipment ID</p>
                                            <p className="font-medium">{selectedOrder.shipping_details?.shiprocket_shipment_id || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <Badge className={statusColors[selectedOrder.shipping_details?.status || 'PENDING'] || 'bg-gray-100'}>
                                              {selectedOrder.shipping_details?.status || 'PENDING'}
                                            </Badge>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-500">Customer</p>
                                            <p className="font-medium">{selectedOrder.customer_name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-500">Shipping Address</p>
                                            <p className="font-medium">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_pincode}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <h3 className="font-medium">Order Items</h3>
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Price</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {selectedOrder.order_items.map((item, index) => (
                                                <TableRow key={index}>
                                                  <TableCell>{item.name}</TableCell>
                                                  <TableCell>{item.quantity}</TableCell>
                                                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                        
                                        <div className="flex justify-end gap-2">
                                          {selectedOrder.shipping_details?.shiprocket_shipment_id && (
                                            <Button 
                                              onClick={() => handleGenerateLabel(selectedOrder.shipping_details.shiprocket_shipment_id!)}
                                              disabled={isActionLoading}
                                            >
                                              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
                                              Generate Label
                                            </Button>
                                          )}
                                          {selectedOrder.shipping_details?.shiprocket_order_id && (
                                            <Button 
                                              onClick={() => handleGenerateInvoice(selectedOrder.shipping_details.shiprocket_order_id!)}
                                              disabled={isActionLoading}
                                              variant="outline"
                                            >
                                              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                              Generate Invoice
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>

                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleCancelShipment(
                                    order.shipping_details?.shiprocket_order_id || '', 
                                    order.shipping_details?.shiprocket_shipment_id
                                  )}
                                  disabled={isActionLoading || order.shipping_details?.status === 'CANCELLED'}
                                >
                                  {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                                  <span className="ml-1 hidden md:inline">Cancel</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ShiprocketManager;
