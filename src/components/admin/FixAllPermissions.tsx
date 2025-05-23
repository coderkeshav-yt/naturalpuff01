import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FixAllPermissions = () => {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFixAllPermissions = async () => {
    setIsFixing(true);

    try {
      console.log('Attempting to fix all database permissions...');
      
      // Call the comprehensive fixPermissions Edge Function
      const { data, error } = await supabase.functions.invoke('fixPermissions');
      
      if (error) {
        console.error('Error fixing permissions:', error);
        throw error;
      }
      
      console.log('All permissions fixed successfully:', data);
      setIsFixed(true);
      
      toast({
        title: 'Success!',
        description: 'All database permissions have been configured correctly.',
      });
      
      // Refresh to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to fix permissions:', error);
      
      // Try individual permission fixes as fallback
      try {
        // Try to fix order permissions
        await supabase.functions.invoke('fixOrderPermissions');
        
        // Try to fix coupon permissions
        await supabase.functions.invoke('setupCouponRLS');
        
        // If we get here, at least some permissions were fixed
        toast({
          title: 'Partial Success',
          description: 'Some database permissions were fixed. You may need to try again for complete configuration.',
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (fallbackError) {
        toast({
          title: 'Error',
          description: 'Failed to fix database permissions. Please contact support.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50">
      <AlertTitle className="text-amber-800">Database Permission Configuration</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          This tool will fix all database permissions for the entire application, including orders, products, coupons, and other tables.
        </p>
        
        <p className="mb-4">
          Use this if you're experiencing permission errors in the checkout process or admin panel.
        </p>
        
        {isFixed ? (
          <p className="text-green-600 font-medium">✓ All permissions have been configured! Refreshing page...</p>
        ) : (
          <Button 
            onClick={handleFixAllPermissions}
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
        )}
      </AlertDescription>
    </Alert>
  );
};

export default FixAllPermissions;
