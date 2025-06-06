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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

interface User {
  id: string;
  email?: string;
  last_sign_in_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  orders?: Order[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles data first
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Get auth users data for emails and last sign in times
      let enhancedUsers: User[] = [];
      
      if (profiles) {
        // For each profile, try to get additional auth info using admin user access
        enhancedUsers = await Promise.all(profiles.map(async (profile) => {
          // Try to get user email with the function
          try {
            const { data, error } = await supabase.rpc('get_user_email', {
              user_id: profile.id
            });
            
            // Make sure email is always a string
            const email: string = data || 'N/A';
            
            return {
              id: profile.id,
              email: email,
              first_name: profile.first_name || 'N/A',
              last_name: profile.last_name || 'N/A',
              phone: profile.phone || 'N/A',
              created_at: profile.created_at,
              last_sign_in_at: undefined // We don't have this in profiles
            };
          } catch (authError) {
            // If we can't get auth data, just use profile data
            return {
              id: profile.id,
              email: 'N/A', // Email not available from profile
              first_name: profile.first_name || 'N/A',
              last_name: profile.last_name || 'N/A',
              phone: profile.phone || 'N/A',
              created_at: profile.created_at,
              last_sign_in_at: undefined
            };
          }
        }));
      }

      setUsers(enhancedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'N/A';
  };

  // Function to search for order by ID and find associated user
  const searchOrderById = async () => {
    if (!searchOrderId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an order ID',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    setFoundOrder(null);
    setFoundUser(null);

    try {
      // Step 1: Find the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', searchOrderId)
        .single();

      if (orderError) {
        throw new Error('Order not found with the provided ID');
      }

      // Step 2: Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      }

      // Step 3: Parse shipping address if it's a string
      let shippingAddress: any = orderData.shipping_address;
      let customerName = 'Guest';
      let customerEmail = 'N/A';
      let customerPhone = 'N/A';

      try {
        if (typeof shippingAddress === 'string') {
          shippingAddress = JSON.parse(shippingAddress);
        }
        
        if (shippingAddress && typeof shippingAddress === 'object') {
          customerName = shippingAddress.customer_name || shippingAddress.name || 'Guest';
          customerEmail = shippingAddress.customer_email || shippingAddress.email || 'N/A';
          customerPhone = shippingAddress.customer_phone || shippingAddress.phone || 'N/A';
        }
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }

      // Step 4: If there's a user_id, get user details
      let userData = null;
      if (orderData.user_id) {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', orderData.user_id)
          .single();

        if (!userError && user) {
          userData = {
            ...user,
            email: customerEmail // Add email from order if available
          };
        }
      }

      // Step 5: Create enhanced order object
      const enhancedOrder: Order = {
        ...orderData,
        customer_name: customerName,
        customer_email: customerEmail,
        items: orderItems || [],
      };

      setFoundOrder(enhancedOrder);
      setFoundUser(userData);
      setIsDialogOpen(true);

      toast({
        title: 'Success',
        description: 'Order found successfully',
      });
    } catch (error: any) {
      console.error('Error searching for order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to find order with the provided ID',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Sort users with most recent first
  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Order ID Search */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium mb-3">Search User by Order ID</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter Order ID"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={searchOrderById}
              disabled={isSearching || !searchOrderId.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Enter a complete order ID to find user details and view full order information.
          </p>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No users available. Users will appear here after they register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {getUserName(user)}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Order #{foundOrder?.id}
              </DialogTitle>
              <DialogDescription>
                {foundOrder && (
                  <div className="text-sm text-gray-500">
                    {new Date(foundOrder.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            {foundOrder && (
              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className="mt-1">{getStatusBadge(foundOrder.status)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Total Amount:</span>
                    <div className="text-lg font-bold">{formatCurrency(foundOrder.total_amount)}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{foundOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{foundOrder.customer_email}</p>
                    </div>
                    {foundUser && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{foundUser.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">User ID</p>
                          <p className="font-medium text-xs">{foundUser.id}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      try {
                        const address = typeof foundOrder.shipping_address === 'string' 
                          ? JSON.parse(foundOrder.shipping_address) 
                          : foundOrder.shipping_address;
                        
                        return (
                          <>
                            <p>{address.address || 'N/A'}</p>
                            <p>{address.city || 'N/A'}, {address.state || 'N/A'} - {address.pincode || 'N/A'}</p>
                            {address.phone && <p>Phone: {address.phone}</p>}
                          </>
                        );
                      } catch (e) {
                        return <p>Unable to parse shipping address</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium mb-2">Order Items</h3>
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
                      {foundOrder.items && foundOrder.items.length > 0 ? (
                        foundOrder.items.map((item, index) => (
                          <TableRow key={item.id || `item-${index}`}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            No items found for this order
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment ID</p>
                      <p className="font-medium">{foundOrder.payment_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <p className="font-medium">{foundOrder.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
