import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DirectPermissionFix = () => {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFixPermissions = async () => {
    setIsFixing(true);

    try {
      console.log('Calling fixAllPermissions function...');
      
      // Call the new comprehensive fixAllPermissions Edge Function
      const { data, error } = await supabase.functions.invoke('fixAllPermissions');
      
      if (error) {
        console.error('Error from fixAllPermissions function:', error);
        throw error;
      }
      
      console.log('Permissions fixed successfully:', data);
      setIsFixed(true);
      
      toast({
        title: 'Success!',
        description: 'All database permissions have been fixed. You can now place orders.',
      });
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to fix permissions:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to fix database permissions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Alert className="mb-6 border-red-300 bg-red-50">
      <AlertTitle className="text-red-800">Database Permission Error</AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-4">
          There is a permission issue with the database that is preventing you from placing orders.
          Click the button below to fix all database permissions.
        </p>
        
        {isFixed ? (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle className="mr-2 h-5 w-5" />
            Permissions have been fixed! Refreshing page...
          </div>
        ) : (
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
              'Fix Database Permissions Now'
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DirectPermissionFix;
