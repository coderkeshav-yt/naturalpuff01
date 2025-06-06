
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomerInfo } from '@/types/product';

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 digits"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  onFormSubmit: (data: CustomerInfo) => void;
  isSubmitting: boolean;
  initialData?: CustomerInfo | null;
}

const CheckoutForm = ({ onFormSubmit, isSubmitting, initialData }: CheckoutFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Initialize the form with initialData if provided
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: initialData ? initialData.name.split(' ')[0] : '',
      lastName: initialData ? initialData.name.split(' ').slice(1).join(' ') : '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
    },
  });

  // Load user profile data if logged in
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      setIsLoadingProfile(true);
      try {
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        // Update form with profile data
        form.reset({
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          email: userData?.user?.email || '',
          phone: profile?.phone || '',
          address: profile?.address || '',
          city: profile?.city || '',
          state: profile?.state || '',
          pincode: profile?.pincode || '',
        });
      } catch (error: any) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile information',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadUserProfile();
  }, [user]);

  // Function to detect user's location using browser's Geolocation API
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap's Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch address information');
          }
          
          const data = await response.json();
          console.log('Nominatim API response:', data); // Debug log
          
          // Get both the formatted address and address components
          const formattedAddress = data.display_name || '';
          const address = data.address || {};
          
          // Extract address components
          const streetNumber = address.house_number || '';
          const street = address.road || '';
          const suburb = address.suburb || '';
          const neighbourhood = address.neighbourhood || '';
          const district = address.district || '';
          const city = address.city || address.town || address.village || '';
          const state = address.state || '';
          const postcode = address.postcode || '';
          
          // Construct shipping address with maximum detail
          let shippingAddress = '';
          
          // Try to build a detailed address from components
          if (streetNumber || street) {
            const streetPart = [streetNumber, street].filter(Boolean).join(' ');
            shippingAddress = streetPart;
            
            // Add neighborhood/suburb if available
            const areaPart = [neighbourhood, suburb, district]
              .filter(Boolean)
              .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
              .join(', ');
              
            if (areaPart) {
              shippingAddress += ', ' + areaPart;
            }
          } else {
            // If no street information, use the first part of the formatted address
            const addressParts = formattedAddress.split(',');
            shippingAddress = addressParts.slice(0, Math.min(2, addressParts.length)).join(',');
          }
          
          console.log('Constructed shipping address:', shippingAddress); // Debug log
          
          // Ensure we have something in the shipping address
          if (!shippingAddress.trim()) {
            shippingAddress = formattedAddress.split(',').slice(0, 2).join(',');
          }
          
          // Update form fields with detailed information
          form.setValue('address', shippingAddress);
          form.setValue('city', city);
          form.setValue('state', state);
          form.setValue('pincode', postcode);
          
          // Force the form to update and validate
          form.trigger(['address', 'city', 'state', 'pincode']);
          
          toast({
            title: 'Location Detected',
            description: 'Your address has been automatically filled',
          });
        } catch (error) {
          console.error('Error fetching address:', error);
          toast({
            title: 'Error',
            description: 'Failed to get your address details',
            variant: 'destructive',
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorMessage = 'Failed to detect your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    );
  };

  const onSubmit = (data: CheckoutFormData) => {
    const customerInfo: CustomerInfo = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    };
    
    onFormSubmit(customerInfo);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    {...field} 
                    disabled={!!user} // Disable if logged in
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="relative">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Shipping Address</FormLabel>
                  <Button
                    type="button"
                    size="sm"
                    className="flex items-center text-xs h-7 px-2 py-1 bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-1 h-3 w-3" />
                        Detect Location
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <Input placeholder="Enter your full address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter 6-digit pincode" 
                    {...field} 
                    maxLength={6}
                    onChange={(e) => {
                      // Allow only numbers and limit to 6 digits
                      const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-brand-600 hover:bg-brand-700 mt-2" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CheckoutForm;
