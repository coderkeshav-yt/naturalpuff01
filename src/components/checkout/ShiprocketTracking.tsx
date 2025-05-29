import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { ShiprocketService } from '@/services/shiprocket';

interface ShiprocketTrackingProps {
  shipmentId: string;
  orderId: string;
}

interface TrackingDetail {
  date: string;
  activity: string;
  location: string;
}

interface TrackingStatus {
  current_status: string;
  current_status_code: number;
  shipment_track: boolean;
  delivered: boolean;
  etd: string;
  pickup_date: string;
  delivered_date: string | null;
  tracking_details: TrackingDetail[];
}

const statusColors = {
  'PICKUP SCHEDULED': 'bg-blue-100 text-blue-800',
  'PICKUP GENERATED': 'bg-blue-100 text-blue-800',
  'PICKUP COMPLETE': 'bg-indigo-100 text-indigo-800',
  'SHIPPED': 'bg-purple-100 text-purple-800',
  'IN TRANSIT': 'bg-amber-100 text-amber-800',
  'OUT FOR DELIVERY': 'bg-orange-100 text-orange-800',
  'DELIVERED': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
  'RTO INITIATED': 'bg-red-100 text-red-800',
  'RTO DELIVERED': 'bg-red-100 text-red-800',
  'PENDING': 'bg-gray-100 text-gray-800',
};

const ShiprocketTracking = ({ shipmentId, orderId }: ShiprocketTrackingProps) => {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrackingDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const trackingData = await ShiprocketService.trackOrder(shipmentId);
      
      if (trackingData && trackingData.tracking_data) {
        setTrackingStatus(trackingData.tracking_data);
      } else {
        setError('No tracking information available');
      }
    } catch (err: any) {
      console.error('Error fetching tracking details:', err);
      setError(err.message || 'Failed to fetch tracking details');
      toast({
        title: 'Error',
        description: 'Failed to fetch tracking details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shipmentId) {
      fetchTrackingDetails();
    }
  }, [shipmentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'IN TRANSIT':
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-amber-600" />;
      case 'PICKUP SCHEDULED':
      case 'PICKUP GENERATED':
      case 'PICKUP COMPLETE':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'CANCELLED':
      case 'RTO INITIATED':
      case 'RTO DELIVERED':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusClass = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Shipment Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trackingStatus ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shipment ID</p>
                <p className="font-medium">{shipmentId}</p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(trackingStatus.current_status)}`}>
                  {trackingStatus.current_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium">{trackingStatus.etd || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup Date</p>
                <p className="font-medium">{formatDate(trackingStatus.pickup_date)}</p>
              </div>
            </div>

            {trackingStatus.delivered && trackingStatus.delivered_date && (
              <div className="bg-green-50 p-3 rounded-md border border-green-200 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-800">Delivered</p>
                  <p className="text-sm text-green-700">{formatDate(trackingStatus.delivered_date)}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-medium mb-3">Tracking History</h3>
              <div className="space-y-4">
                {trackingStatus.tracking_details && trackingStatus.tracking_details.length > 0 ? (
                  trackingStatus.tracking_details.map((detail, index) => (
                    <div key={index} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="rounded-full h-8 w-8 flex items-center justify-center bg-brand-100 text-brand-600">
                          {getStatusIcon(detail.activity)}
                        </div>
                        {index < trackingStatus.tracking_details.length - 1 && (
                          <div className="h-full w-0.5 bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">{detail.activity}</p>
                        <p className="text-sm text-gray-500">{formatDate(detail.date)}</p>
                        {detail.location && <p className="text-sm text-gray-700">{detail.location}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tracking history available</p>
                )}
              </div>
            </div>

            <Button 
              onClick={fetchTrackingDetails} 
              variant="outline" 
              className="mt-4"
            >
              Refresh Tracking
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No tracking information available</p>
            <Button 
              onClick={fetchTrackingDetails} 
              variant="outline" 
              className="mt-4"
            >
              Check Tracking
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShiprocketTracking;
