
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RefreshDataButtonProps {
  onRefreshComplete?: () => void;
  text?: string;
  className?: string;
}

export const RefreshDataButton: React.FC<RefreshDataButtonProps> = ({ 
  onRefreshComplete, 
  text = 'Refresh Products',
  className = 'bg-brand-600 hover:bg-brand-700'
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('updateProducts', {
        body: {},
      });

      if (error) {
        throw new Error(error.message || 'Failed to update products');
      }

      toast({
        title: "Products Updated",
        description: "The product data has been refreshed successfully.",
      });

      // Call the callback if provided
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } catch (error: any) {
      console.error('Error refreshing products:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh product data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefreshData}
      disabled={isRefreshing}
      className={className}
      size="sm"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : text}
    </Button>
  );
};

export default RefreshDataButton;
