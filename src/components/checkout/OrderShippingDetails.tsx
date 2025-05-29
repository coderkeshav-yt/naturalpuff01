import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Package, Truck, MapPin } from 'lucide-react';
import { ShiprocketService } from '@/services/shiprocket';
import OrderTrackingCard from './OrderTrackingCard';

interface OrderShippingDetailsProps {
  orderId: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingDetails?: {
    shiprocket_order_id?: string;
    shiprocket_shipment_id?: string;
    tracking_url?: string;
    courier_name?: string;
    courier_id?: string;
    status?: string;
  };
}

const OrderShippingDetails = ({
  orderId,
  customerName,
  shippingAddress,
  shippingCity,
  shippingState,
  shippingPincode,
  shippingDetails
}: OrderShippingDetailsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const { toast } = useToast();

  const fetchTrackingData = async () => {
    if (!shippingDetails?.shiprocket_shipment_id) return;
    
    setIsLoading(true);
    try {
      const data = await ShiprocketService.trackOrder(shippingDetails.shiprocket_shipment_id);
      if (data) {
        setTrackingData(data);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tracking information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shippingDetails?.shiprocket_shipment_id) {
      fetchTrackingData();
    }
  }, [shippingDetails?.shiprocket_shipment_id]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{customerName}</p>
              <p className="text-gray-600">{shippingAddress}</p>
              <p className="text-gray-600">{shippingCity}, {shippingState} - {shippingPincode}</p>
            </div>

            {shippingDetails?.courier_name && (
              <div>
                <Separator className="my-3" />
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium">Shipping via {shippingDetails.courier_name}</p>
                    {shippingDetails.shiprocket_order_id && (
                      <p className="text-sm text-gray-500">Shiprocket Order: {shippingDetails.shiprocket_order_id}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {shippingDetails && (
        <OrderTrackingCard 
          orderId={orderId}
          orderStatus={shippingDetails.status || 'PENDING'}
          shipmentId={shippingDetails.shiprocket_shipment_id}
          trackingUrl={shippingDetails.tracking_url}
          courierName={shippingDetails.courier_name}
        />
      )}

      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      )}
    </div>
  );
};

export default OrderShippingDetails;
