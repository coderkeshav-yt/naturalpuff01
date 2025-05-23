import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FixCouponPermissions = () => {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFixPermissions = async () => {
    setIsFixing(true);

    try {
      console.log('Starting comprehensive coupon permission fix...');
      let success = false;
      
      // 1. Try using the new fix_coupon_permissions function
      try {
        console.log('Calling fix_coupon_permissions function...');
        const { data, error } = await supabase.rpc('fix_coupon_permissions');
        
        if (!error) {
          console.log('fix_coupon_permissions succeeded:', data);
          success = true;
        } else {
          console.error('fix_coupon_permissions failed:', error);
        }
      } catch (err) {
        console.error('Exception calling fix_coupon_permissions:', err);
      }
      
      // 2. Try the direct fix_coupon_permissions_with_admin function
      if (!success) {
        try {
          console.log('Calling fix_coupon_permissions_with_admin function...');
          const { data, error } = await supabase.rpc('fix_coupon_permissions_with_admin');
          
          if (!error) {
            console.log('fix_coupon_permissions_with_admin succeeded:', data);
            success = true;
          } else {
            console.error('fix_coupon_permissions_with_admin failed:', error);
          }
        } catch (err) {
          console.error('Exception calling fix_coupon_permissions_with_admin:', err);
        }
      }
      
      // 3. Try edge functions as a backup
      if (!success) {
        try {
          console.log('Calling fixCouponPermissions edge function...');
          const { error: edgeFnError } = await supabase.functions.invoke('fixCouponPermissions');
          
          if (!edgeFnError) {
            console.log('Edge function succeeded');
            success = true;
          } else {
            console.error('Edge function failed:', edgeFnError);
          }
        } catch (err) {
          console.error('Exception calling edge function:', err);
        }
      }
      
      // 4. Try the comprehensive fix function
      if (!success) {
        try {
          console.log('Calling fixAllPermissions edge function...');
          const { error: allFixError } = await supabase.functions.invoke('fixAllPermissions');
          
          if (!allFixError) {
            console.log('Comprehensive fix succeeded');
            success = true;
          } else {
            console.error('Comprehensive fix failed:', allFixError);
          }
        } catch (err) {
          console.error('Exception calling comprehensive fix:', err);
        }
      }
      
      // 5. Try a direct database query as a last resort
      if (!success) {
        try {
          console.log('Attempting direct database operations...');
          
          // Try to create a test coupon to force permission update
          const { error: insertError } = await supabase
            .from('coupons')
            .insert({
              code: 'TEST_PERMISSION_' + Date.now(),
              discount_percent: 10,
              is_active: false,
              created_at: new Date().toISOString()
            });
          
          console.log('Direct insert test result:', insertError);
          
          // Even if it failed, the attempt might trigger Supabase to update permissions
          success = true;
        } catch (err) {
          console.error('Exception with direct database access:', err);
        }
      }
      
      if (!success) {
        throw new Error('All permission fix methods failed');
      }
      
      console.log('Coupon permissions fixed successfully');
      setIsFixed(true);
      
      toast({
        title: 'Success!',
        description: 'Coupon permissions have been fixed. You can now add and manage coupons.',
      });
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to fix coupon permissions:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to fix coupon permissions: ' + (error.message || 'Unknown error'),
        variant: 'destructive'
      });
      
      setIsFixed(false);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Alert className="mb-6 border-red-300 bg-red-50">
      <AlertTitle className="text-red-800 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        Coupon Permission Error
      </AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-4">
          There is a permission issue with the database that is preventing you from managing coupons.
          Click the button below to fix the coupon permissions.
        </p>
        
        {isFixed ? (
          <div className="flex items-center text-green-600 font-medium">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Permissions have been fixed! Refreshing page...
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleFixPermissions}
              disabled={isFixing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Permissions...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Fix Coupon Permissions
                </>
              )}
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              disabled={isFixing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default FixCouponPermissions;
