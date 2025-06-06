
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface OrderPolicyErrorProps {
  onFix?: () => Promise<boolean>;
}

// This is a utility component to help administrators understand and fix RLS policy errors
const OrderPolicyError = ({ onFix }: OrderPolicyErrorProps) => {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFixRLS = async () => {
    setIsFixing(true);

    try {
      // Use provided onFix function if available, otherwise use default implementation
      if (onFix) {
        const result = await onFix();
        if (!result) {
          throw new Error('Failed to fix permissions');
        }
      } else {
        // Call our dedicated edge function to fix order permissions
        const { data, error } = await supabase.functions.invoke('fixOrderPermissions');

        if (error) {
          console.error("RLS policy configuration error:", error);
          throw error;
        }
      }

      setIsFixed(true);
      toast({
        title: "Success!",
        description: "The database permissions have been configured correctly.",
      });
      
      // Refresh to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error fixing RLS policies:", error);
      
      // Try the RPC method as fallback
      try {
        const { error: rpcError } = await supabase.rpc('configure_order_rls_policies');
        
        if (rpcError) {
          throw rpcError;
        }
        
        setIsFixed(true);
        toast({
          title: "Success!",
          description: "The database permissions have been configured correctly using fallback method.",
        });
        
        // Refresh to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (fallbackError: any) {
        toast({
          title: "Error",
          description: "Failed to configure database permissions. Please make sure you have the correct admin privileges.",
          variant: "destructive"
        });
      }
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50">
      <AlertTitle className="text-amber-800">Row Level Security Policy Configuration Needed</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">There is a permission issue with the orders table in the database. This happens when row-level security (RLS) policies are not properly configured.</p>
        
        <p className="mb-4">To fix this issue, you need to configure RLS policies for the orders table. This requires database administration privileges.</p>
        
        {isFixed ? (
          <p className="text-green-600 font-medium">✓ Permissions have been configured! Refreshing page...</p>
        ) : (
          <Button 
            onClick={handleFixRLS}
            disabled={isFixing}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Permissions...
              </>
            ) : (
              'Fix Permissions'
            )}
          </Button>
        )}
        
        <p className="mt-2 text-xs">
          Note: This will create RLS policies allowing users to see only their own orders and allowing the admin user to see all orders.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default OrderPolicyError;
