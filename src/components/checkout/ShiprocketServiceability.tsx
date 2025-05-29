
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { ShiprocketService } from '@/services/shiprocket';

interface CourierOption {
  courier_name: string;
  courier_code: string;
  rate: number;
  etd: string;
  serviceability_type: string;
}

interface ShiprocketServiceabilityCheckerProps {
  pincode: string;
  setPincode: (pincode: string) => void;
  shippingCost: number;
  setShippingCost: (cost: number) => void;
  selectedCourier: string;
  setSelectedCourier: (courier: string) => void;
  setCourierOptions?: (options: CourierOption[]) => void;
}

const ShiprocketServiceabilityChecker = ({
  pincode, 
  setPincode,
  shippingCost,
  setShippingCost,
  selectedCourier,
  setSelectedCourier,
  setCourierOptions
}: ShiprocketServiceabilityCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [courierOptions, setLocalCourierOptions] = useState<CourierOption[]>([]);
  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setPincode(value);
    
    // Reset selection if pincode changes
    if (value.length !== 6) {
      setSelectedCourier('');
      setShippingCost(0);
      setCourierOptions([]);
      setIsServiceable(null);
    }
  };

  const checkServiceability = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode.",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setSelectedCourier('');
    setShippingCost(0);

    try {
      // Call the Shiprocket API via our service
      const courierOptions = await ShiprocketService.checkServiceability({
        pickup_pincode: '110001', // Default pickup pincode (warehouse)
        delivery_pincode: pincode,
        weight: 0.5, // Default weight in kg
        cod: false // Cash on delivery option
      });
      
      if (courierOptions.length === 0) {
        // No courier options available for this pincode
        setLocalCourierOptions([]);
        if (setCourierOptions) {
          setCourierOptions([]);
        }
        setIsServiceable(false);
      } else {
        // Courier options available
        setLocalCourierOptions(courierOptions);
        if (setCourierOptions) {
          setCourierOptions(courierOptions);
        }
        setIsServiceable(true);
      }
    } catch (error: any) {
      console.error('Error checking pincode serviceability:', error);
      toast({
        title: "Error",
        description: "Failed to check delivery availability. Please try again.",
        variant: "destructive"
      });
      setIsServiceable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectCourier = (courierCode: string) => {
    setSelectedCourier(courierCode);
    
    // Set shipping cost based on selected courier
    const selectedOption = courierOptions.find(option => option.courier_code === courierCode);
    if (selectedOption) {
      setShippingCost(selectedOption.rate);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Enter delivery pincode"
            value={pincode}
            onChange={handlePincodeChange}
            className="w-full"
            maxLength={6}
          />
        </div>
        <Button 
          onClick={checkServiceability}
          disabled={isChecking || pincode.length !== 6}
          className="whitespace-nowrap"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Check Availability
            </>
          )}
        </Button>
      </div>

      {isServiceable === false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sorry, we don't deliver to this pincode yet. Please try a different pincode.
          </AlertDescription>
        </Alert>
      )}

      {courierOptions.length > 0 && (
        <RadioGroup 
          value={selectedCourier} 
          onValueChange={handleSelectCourier}
          className="space-y-2"
        >
          {courierOptions.map((option) => (
            <div 
              key={option.courier_code}
              className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectCourier(option.courier_code)}
            >
              <RadioGroupItem 
                value={option.courier_code} 
                id={option.courier_code} 
              />
              <label 
                htmlFor={option.courier_code}
                className="flex-1 flex justify-between cursor-pointer"
              >
                <div>
                  <p className="font-medium">{option.courier_name}</p>
                  <p className="text-sm text-gray-500">Estimated delivery: {option.etd}</p>
                </div>
                <p className="font-medium">₹{option.rate}</p>
              </label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
};

export default ShiprocketServiceabilityChecker;
