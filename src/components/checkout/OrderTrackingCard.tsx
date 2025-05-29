import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ShiprocketTracking from './ShiprocketTracking';

interface OrderTrackingCardProps {
  orderId: string;
  orderStatus: string;
  shipmentId?: string;
  trackingUrl?: string;
  courierName?: string;
}

const statusColors: Record<string, string> = {
  'CREATED': 'bg-blue-100 text-blue-800',
  'PICKUP': 'bg-indigo-100 text-indigo-800',
  'SHIPPED': 'bg-purple-100 text-purple-800',
  'IN_TRANSIT': 'bg-amber-100 text-amber-800',
  'OUT_FOR_DELIVERY': 'bg-orange-100 text-orange-800',
  'DELIVERED': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
  'PENDING': 'bg-gray-100 text-gray-800',
};

const OrderTrackingCard = ({ 
  orderId, 
  orderStatus, 
  shipmentId, 
  trackingUrl, 
  courierName 
}: OrderTrackingCardProps) => {
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const getStatusIcon = () => {
    switch (orderStatus) {
      case 'DELIVERED':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-amber-600" />;
      case 'OUT_FOR_DELIVERY':
        return <MapPin className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Truck className="mr-2 h-5 w-5" />
          Shipment Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">#{orderId}</p>
            </div>
            <Badge className={statusColors[orderStatus] || 'bg-gray-100'}>
              {orderStatus}
            </Badge>
          </div>

          {courierName && (
            <div>
              <p className="text-sm text-gray-500">Courier</p>
              <p className="font-medium">{courierName}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {shipmentId && (
              <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Package className="mr-2 h-4 w-4" />
                    Track Shipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Shipment Tracking</DialogTitle>
                  </DialogHeader>
                  <ShiprocketTracking shipmentId={shipmentId} orderId={orderId} />
                </DialogContent>
              </Dialog>
            )}

            {trackingUrl && (
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => window.open(trackingUrl, '_blank')}
              >
                <Truck className="mr-2 h-4 w-4" />
                Track on Courier Website
              </Button>
            )}
          </div>

          {!shipmentId && !trackingUrl && (
            <div className="text-center py-4">
              <p className="text-gray-500">Tracking information will be available once your order ships.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTrackingCard;
