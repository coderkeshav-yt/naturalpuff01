import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const FixPermissionsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<{
    orders: boolean | null;
    products: boolean | null;
    coupons: boolean | null;
    all: boolean | null;
  }>({
    orders: null,
    products: null,
    coupons: null,
    all: null
  });

  const fixAllPermissions = async () => {
    setIsFixing(true);
    setResults({
      orders: null,
      products: null,
      coupons: null,
      all: null
    });

    try {
      // Try the comprehensive fix first
      const { data, error } = await supabase.functions.invoke('fixPermissions');
      
      if (error) {
        console.error('Error fixing all permissions:', error);
        setResults(prev => ({ ...prev, all: false }));
        
        // If the comprehensive fix fails, try individual fixes
        await fixIndividualPermissions();
      } else {
        console.log('All permissions fixed successfully:', data);
        setResults({
          orders: true,
          products: true,
          coupons: true,
          all: true
        });
        
        toast({
          title: 'Success!',
          description: 'All database permissions have been configured correctly.',
        });
      }
    } catch (error) {
      console.error('Failed to fix all permissions:', error);
      setResults(prev => ({ ...prev, all: false }));
      
      // Try individual fixes as fallback
      await fixIndividualPermissions();
    } finally {
      setIsFixing(false);
    }
  };

  const fixIndividualPermissions = async () => {
    // Fix order permissions
    try {
      await supabase.functions.invoke('fixOrderPermissions');
      setResults(prev => ({ ...prev, orders: true }));
    } catch (error) {
      console.error('Failed to fix order permissions:', error);
      setResults(prev => ({ ...prev, orders: false }));
    }
    
    // Fix product permissions
    try {
      // Assuming there's a function to fix product permissions
      await supabase.functions.invoke('fixProductPermissions');
      setResults(prev => ({ ...prev, products: true }));
    } catch (error) {
      console.error('Failed to fix product permissions:', error);
      setResults(prev => ({ ...prev, products: false }));
    }
    
    // Fix coupon permissions
    try {
      await supabase.functions.invoke('setupCouponRLS');
      setResults(prev => ({ ...prev, coupons: true }));
    } catch (error) {
      console.error('Failed to fix coupon permissions:', error);
      setResults(prev => ({ ...prev, coupons: false }));
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return null;
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Database Permissions Fixer</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fix Supabase Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTitle className="text-amber-800">Permission Configuration Tool</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-4">
                This tool will fix all database permissions for the entire application, including orders, products, coupons, and other tables.
                Use this if you're experiencing permission errors in the checkout process or admin panel.
              </p>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Orders Permissions</span>
              {getStatusIcon(results.orders)}
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Products Permissions</span>
              {getStatusIcon(results.products)}
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Coupons Permissions</span>
              {getStatusIcon(results.coupons)}
            </div>
            <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
              <span className="font-medium">All Permissions</span>
              {getStatusIcon(results.all)}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 pt-4">
            <Button 
              onClick={fixAllPermissions}
              disabled={isFixing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing All Permissions...
                </>
              ) : (
                'Fix All Database Permissions'
              )}
            </Button>
            
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              disabled={isFixing}
              className="mt-2"
            >
              Back
            </Button>
          </div>
          
          {Object.values(results).some(result => result === true) && (
            <Alert className="mt-4 border-green-300 bg-green-50">
              <AlertTitle className="text-green-800">Some permissions fixed successfully</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>Some database permissions have been fixed. Please try your operation again.</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-2 border-green-500 text-green-700 hover:bg-green-100"
                >
                  Refresh Page
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixPermissionsPage;
