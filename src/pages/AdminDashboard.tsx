
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from 'lucide-react';
import OrderPolicyError from '@/components/layout/OrderPolicyError';
import CouponManagement from '@/components/admin/CouponManagement';
import OrdersManagement from '@/components/admin/OrdersManagement';
import UserManagement from '@/components/admin/UserManagement';
import DashboardOverview from '@/components/admin/DashboardOverview';
import ProductManagement from '@/components/admin/ProductManagement';
import CarouselManagement from '@/components/admin/CarouselManagement';
import ContactMessagesManagement from '@/components/admin/ContactMessagesManagement';

const ADMIN_USER_ID = 'a3301900-bf5e-4afe-a114-d59bb08a05a1';

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showRlsWarning, setShowRlsWarning] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is an admin
    checkIfAdmin();
  }, [user, navigate]);

  const checkIfAdmin = async () => {
    setIsLoading(true);
    try {
      // For this application, we're using a specific user ID as admin
      if (user?.id === ADMIN_USER_ID) {
        setIsAdmin(true);
        
        // Test if the RLS policies are working
        try {
          const { error } = await supabase
            .from('orders')
            .select('id')
            .limit(1);
          
          // If there's no error, RLS is working correctly
          if (!error) {
            setShowRlsWarning(false);
          }
        } catch (orderError) {
          console.error("Error checking orders access:", orderError);
          // Keep warning shown
        }
        
        // Check if we can create and update RLS policies for all required tables
        try {
          await configureAllPolicies();
        } catch (policyError) {
          console.error("Error configuring policies:", policyError);
        }
      } else {
        // If not the admin user, redirect to home
        toast({
          title: "Unauthorized",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while checking permissions.",
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Configure all required policies (products, coupons, orders)
  const configureAllPolicies = async () => {
    // Configure product policies
    try {
      const { error: productError } = await supabase.rpc('configure_product_rls_policies');
      if (productError) {
        console.error("Error configuring product policies:", productError);
        toast({
          title: "Product Policy Error",
          description: "Could not configure product table permissions. Some functions may be limited.",
          variant: "destructive"
        });
      } else {
        console.log("Product policies configured successfully");
      }
    } catch (error: any) {
      console.error("Error configuring product policies:", error);
    }

    // Configure coupon policies
    try {
      const { error: couponError } = await supabase.rpc('configure_coupon_rls_policies');
      if (couponError) {
        console.error("Error configuring coupon policies:", couponError);
        toast({
          title: "Coupon Policy Error",
          description: "Could not configure coupon table permissions. Some functions may be limited.",
          variant: "destructive"
        });
      } else {
        console.log("Coupon policies configured successfully");
      }
    } catch (error: any) {
      console.error("Error configuring coupon policies:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Don't render anything until we verify admin status
  }

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-brand-800 font-playfair">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => navigate('/fix-permissions')} 
            variant="outline" 
            className="border-amber-600 text-amber-700 hover:bg-amber-50"
          >
            Fix Database Permissions
          </Button>
          <Button variant="destructive" onClick={() => signOut()}>
            Logout
          </Button>
        </div>
      </div>

      {showRlsWarning && <OrderPolicyError />}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 w-full overflow-x-auto md:w-auto">
          <TabsTrigger value="overview" className="text-base whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="products" className="text-base whitespace-nowrap">Products</TabsTrigger>
          <TabsTrigger value="orders" className="text-base whitespace-nowrap">Orders</TabsTrigger>
          <TabsTrigger value="users" className="text-base whitespace-nowrap">Users</TabsTrigger>
          <TabsTrigger value="coupons" className="text-base whitespace-nowrap">Coupons</TabsTrigger>
          <TabsTrigger value="carousel" className="text-base whitespace-nowrap">Carousel</TabsTrigger>
          <TabsTrigger value="messages" className="text-base whitespace-nowrap">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <DashboardOverview />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-brand-600" />
                  Shiprocket Integration
                </CardTitle>
                <CardDescription>
                  Manage shipping, track orders, and configure Shiprocket settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Integrate with Shiprocket to automate your shipping workflow, generate labels, and provide tracking information to customers.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/dashboard/shiprocket')} className="w-full">
                  Manage Shipping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersManagement />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="coupons">
          <CouponManagement />
        </TabsContent>
        
        <TabsContent value="carousel">
          <CarouselManagement />
        </TabsContent>
        
        <TabsContent value="messages">
          <ContactMessagesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
