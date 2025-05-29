import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShiprocketConfigProps {
  onConfigSaved?: () => void;
}

interface ShiprocketConfigData {
  email: string;
  password: string;
  pickup_location: string;
  pickup_pincode: string;
  warehouse_address: string;
  warehouse_city: string;
  warehouse_state: string;
  company_name: string;
}

const ShiprocketConfig = ({ onConfigSaved }: ShiprocketConfigProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [configData, setConfigData] = useState<ShiprocketConfigData>({
    email: process.env.NEXT_PUBLIC_SHIPROCKET_EMAIL || '',
    password: process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD || '',
    pickup_location: process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_LOCATION || 'Primary',
    pickup_pincode: process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE || '',
    warehouse_address: process.env.NEXT_PUBLIC_WAREHOUSE_ADDRESS || '',
    warehouse_city: process.env.NEXT_PUBLIC_WAREHOUSE_CITY || '',
    warehouse_state: process.env.NEXT_PUBLIC_WAREHOUSE_STATE || '',
    company_name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Natural Puff',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      // Try to get from localStorage first
      const storedConfig = localStorage.getItem('shiprocket_config');
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig);
          if (parsedConfig && typeof parsedConfig === 'object') {
            setConfigData(parsedConfig as ShiprocketConfigData);
          }
        } catch (e) {
          console.error('Error parsing stored config:', e);
        }
      }
      
      // Try to get from edge function
      try {
        const { data, error } = await supabase.functions.invoke('shiprocket', {
          body: { endpoint: 'get-config' },
          method: 'POST',
        });
        
        if (!error && data && data.config) {
          setConfigData(data.config as ShiprocketConfigData);
          // Update localStorage with latest data
          localStorage.setItem('shiprocket_config', JSON.stringify(data.config));
        }
      } catch (apiError) {
        console.warn('Could not fetch from API:', apiError);
      }
    } catch (error: any) {
      console.error('Error fetching Shiprocket config:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Shiprocket configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      const requiredFields = ['email', 'password', 'pickup_pincode', 'warehouse_address', 'warehouse_city', 'warehouse_state'];
      const missingFields = requiredFields.filter(field => !configData[field as keyof ShiprocketConfigData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Save to localStorage as a fallback
      localStorage.setItem('shiprocket_config', JSON.stringify(configData));

      // Save to edge function
      try {
        const { error } = await supabase.functions.invoke('shiprocket', {
          body: {
            endpoint: 'save-config',
            config: configData
          },
          method: 'POST',
        });

        if (error) {
          console.warn('Could not save to API, using localStorage only:', error);
        }
      } catch (apiError) {
        console.warn('Error saving to API, using localStorage only:', apiError);
      }

      toast({
        title: 'Success',
        description: 'Shiprocket configuration saved successfully',
      });

      // Update environment variables in Supabase Edge Functions
      try {
        const { error: envError } = await supabase.functions.invoke('shiprocket', {
          body: {
            endpoint: 'update-config',
            email: configData.email,
            password: configData.password,
            pickup_location: configData.pickup_location,
            pickup_pincode: configData.pickup_pincode
          },
          method: 'POST',
        });

        if (envError) {
          console.error('Error updating environment variables:', envError);
          toast({
            title: 'Warning',
            description: 'Configuration saved locally but failed to update server settings',
            variant: 'destructive',
          });
        }
      } catch (envError) {
        console.error('Error updating environment variables:', envError);
      }

      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error: any) {
      console.error('Error saving Shiprocket config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Shiprocket configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'test-connection',
          email: configData.email,
          password: configData.password,
        },
        method: 'POST',
      });

      if (error) throw error;

      if (data && data.success) {
        toast({
          title: 'Success',
          description: 'Successfully connected to Shiprocket',
        });
      } else {
        throw new Error(data?.message || 'Failed to connect to Shiprocket');
      }
    } catch (error: any) {
      console.error('Error testing Shiprocket connection:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect to Shiprocket',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Shiprocket Configuration</CardTitle>
        <CardDescription>
          Configure your Shiprocket account settings for order fulfillment and shipping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  value={configData.email}
                  onChange={handleInputChange}
                  placeholder="Enter Shiprocket account email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={configData.password}
                  onChange={handleInputChange}
                  placeholder="Enter Shiprocket account password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={configData.company_name}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Warehouse Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location Name *</Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  value={configData.pickup_location}
                  onChange={handleInputChange}
                  placeholder="Enter pickup location name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_pincode">Pickup Pincode *</Label>
                <Input
                  id="pickup_pincode"
                  name="pickup_pincode"
                  value={configData.pickup_pincode}
                  onChange={handleInputChange}
                  placeholder="Enter pickup pincode"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="warehouse_address">Warehouse Address *</Label>
                <Input
                  id="warehouse_address"
                  name="warehouse_address"
                  value={configData.warehouse_address}
                  onChange={handleInputChange}
                  placeholder="Enter warehouse address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse_city">City *</Label>
                <Input
                  id="warehouse_city"
                  name="warehouse_city"
                  value={configData.warehouse_city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse_state">State *</Label>
                <Input
                  id="warehouse_state"
                  name="warehouse_state"
                  value={configData.warehouse_state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={saveConfig} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
            <Button 
              onClick={testConnection} 
              disabled={isTesting || !configData.email || !configData.password}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShiprocketConfig;
