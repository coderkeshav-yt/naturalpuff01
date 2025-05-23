
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email?: string;
  phone?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_id: string | null;
  shipping_address: ShippingAddress | Json;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
}

const Profile = () => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to access your profile',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [user, navigate, toast]);

  // Load user profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        pincode: userProfile.pincode || ''
      });
    }
  }, [userProfile]);

  // Fetch user's orders
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Setup real-time subscription for order status updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          // Update the order in the state when it changes
          const updatedOrder = payload.new as Order;
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? {...order, ...updatedOrder} : order
            )
          );
          
          // If this is the selected order, update it too
          if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder({...selectedOrder, ...updatedOrder});
          }
          
          // Show a notification of the status change
          toast({
            title: "Order Status Updated",
            description: `Order #${updatedOrder.id.substring(0, 8)} status changed to ${updatedOrder.status}`,
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedOrder, toast]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // Type assertion to handle the mismatch with shipping_address
      setOrders(ordersData as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        throw error;
      }

      const order = orders.find(o => o.id === orderId);
      if (order) {
        const orderWithItems = { ...order, items: data as OrderItem[] };
        setSelectedOrder(orderWithItems);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Refresh profile data
      await refreshProfile();
      
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-indigo-100 text-indigo-800">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Helper function to safely access shipping_address properties
  const getShippingAddressProp = (address: ShippingAddress | Json, prop: keyof ShippingAddress): string => {
    if (address && typeof address === 'object') {
      return (address as any)[prop] || '';
    }
    return '';
  };

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="section-padding bg-cream-100 min-h-screen">
      <div className="container-custom max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-brand-600 py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white font-playfair">My Account</h1>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-brand-600"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Order History</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-playfair">Personal Information</h2>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        className="border-brand-600 text-brand-600"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                          <Input
                            id="pincode"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="submit"
                          className="bg-brand-600 hover:bg-brand-700 text-white"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{userProfile?.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">First Name</p>
                          <p className="font-medium">{userProfile?.first_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Name</p>
                          <p className="font-medium">{userProfile?.last_name || '—'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {userProfile?.address ? (
                            <>
                              {userProfile.address}<br />
                              {userProfile.city}, {userProfile.state} - {userProfile.pincode}
                            </>
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Orders Tab */}
              <TabsContent value="orders">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-brand-700">Loading orders...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <>
                    {/* Order list view */}
                    {!selectedOrder ? (
                      <Table>
                        <TableCaption>Your recent orders</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                              <TableCell>{formatDate(order.created_at)}</TableCell>
                              <TableCell>₹{order.total_amount}</TableCell>
                              <TableCell>
                                {getStatusBadge(order.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => fetchOrderDetails(order.id)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      /* Order detail view */
                      <div>
                        <div className="mb-4">
                          <Button 
                            variant="ghost" 
                            className="text-brand-600"
                            onClick={() => setSelectedOrder(null)}
                          >
                            &larr; Back to Orders
                          </Button>
                        </div>
                        
                        <div className="bg-cream-50 rounded-lg p-6 mb-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold">Order #{selectedOrder.id.substring(0, 8)}...</h3>
                              <p className="text-gray-600">{formatDate(selectedOrder.created_at)}</p>
                            </div>
                            {getStatusBadge(selectedOrder.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">Shipping Address</h4>
                              <p>
                                {getShippingAddressProp(selectedOrder.shipping_address, 'name')}<br />
                                {getShippingAddressProp(selectedOrder.shipping_address, 'address')}<br />
                                {getShippingAddressProp(selectedOrder.shipping_address, 'city')}, {getShippingAddressProp(selectedOrder.shipping_address, 'state')}<br />
                                {getShippingAddressProp(selectedOrder.shipping_address, 'pincode')}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Payment Information</h4>
                              <p>Payment ID: {selectedOrder.payment_id}</p>
                              <p>Total Amount: ₹{selectedOrder.total_amount}</p>
                              {selectedOrder.status === 'cancelled' && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                  <div className="flex items-center text-red-700">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    <p className="font-medium">This order has been cancelled</p>
                                  </div>
                                </div>
                              )}
                              {selectedOrder.status === 'shipped' && (
                                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                                  <p className="font-medium text-purple-700">Your order is on the way!</p>
                                </div>
                              )}
                              {selectedOrder.status === 'delivered' && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                  <p className="font-medium text-green-700">Your order has been delivered</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold mb-3">Order Items</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrder.items?.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell className="text-right">₹{item.price}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">₹{item.price * item.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <Button 
                      className="bg-brand-600 hover:bg-brand-700"
                      onClick={() => navigate('/products')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
