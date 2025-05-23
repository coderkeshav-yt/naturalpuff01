
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewData {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: any[];
  ordersByStatus: Record<string, number>;
  lastMonthRevenue: any[];
}

const DashboardOverview = () => {
  const [data, setData] = useState<OverviewData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    recentOrders: [],
    ordersByStatus: {},
    lastMonthRevenue: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      // Fetch total orders and revenue
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) throw ordersError;

      // Fetch total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Fetch total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Fetch total users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const totalUsers = authUsers?.users?.length || 0;

      // Fetch recent orders
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Fetch orders by status
      const { data: statusData, error: statusError } = await supabase
        .from('orders')
        .select('status');

      if (statusError) throw statusError;

      const ordersByStatus: Record<string, number> = {};
      statusData?.forEach((order) => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Generate data for last month revenue chart
      const lastMonthRevenue = generateLastMonthData(revenueData || []);

      setData({
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalProducts: totalProducts || 0,
        totalUsers,
        recentOrders: recentOrders || [],
        ordersByStatus,
        lastMonthRevenue,
      });
    } catch (error: any) {
      console.error('Error fetching overview data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLastMonthData = (orders: any[]) => {
    // Get current date and date from 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Initialize data array with 30 days
    const data: any[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: 0,
      });
    }

    // Fill in revenue data
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= thirtyDaysAgo && orderDate <= today) {
        const dateStr = orderDate.toISOString().split('T')[0];
        const dayIndex = data.findIndex(d => d.date === dateStr);
        if (dayIndex !== -1) {
          data[dayIndex].revenue += order.total_amount;
        }
      }
    });

    // Format dates for display
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Convert orders by status into chart format
  const statusChartData = Object.entries(data.ordersByStatus).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(data.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue (Last 30 Days)</CardTitle>
              <CardDescription>Daily revenue from sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.lastMonthRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(data.lastMonthRevenue.length / 10)}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), "Revenue"]} 
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of orders by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
