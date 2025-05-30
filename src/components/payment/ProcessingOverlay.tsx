import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProcessingOverlayProps {
  orderId: string;
  onCancel: () => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ orderId, onCancel }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showCancelOption, setShowCancelOption] = useState(false);
  const navigate = useNavigate();

  // Set up a timer to track how long the processing screen has been shown
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
      
      // After 10 seconds, show the cancel option
      if (elapsed >= 10 && !showCancelOption) {
        setShowCancelOption(true);
      }
      
      // After 20 seconds, automatically redirect to verification page
      if (elapsed >= 20) {
        clearInterval(timer);
        console.log('Payment processing timeout - redirecting to verification page');
        navigate(`/payment-verification?order_id=${orderId}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [orderId, navigate, showCancelOption]);

  // Handle manual verification
  const handleVerifyManually = () => {
    // Clear any safety timeouts to prevent duplicate redirects
    const timeoutId = localStorage.getItem('upi_safety_timeout');
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId));
      localStorage.removeItem('upi_safety_timeout');
    }
    
    navigate(`/payment-verification?order_id=${orderId}`);
  };
  
  // Clear safety timeout when component unmounts
  useEffect(() => {
    return () => {
      const timeoutId = localStorage.getItem('upi_safety_timeout');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        localStorage.removeItem('upi_safety_timeout');
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold text-center mb-2">Processing your payment</h2>
          <p className="text-center text-muted-foreground mb-6">
            This will only take a few seconds.
          </p>
          
          {showCancelOption && (
            <div className="w-full space-y-3 mt-4">
              <p className="text-sm text-center text-muted-foreground">
                {timeElapsed >= 15 ? (
                  "It's taking longer than expected. You can verify your payment status manually."
                ) : (
                  "If you've already completed payment in your UPI app, click below to check status."
                )}
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleVerifyManually}
              >
                Verify Payment Status
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => {
                  // Clear any safety timeouts before canceling
                  const timeoutId = localStorage.getItem('upi_safety_timeout');
                  if (timeoutId) {
                    clearTimeout(parseInt(timeoutId));
                    localStorage.removeItem('upi_safety_timeout');
                  }
                  // Clear payment flags
                  localStorage.removeItem('payment_in_progress');
                  sessionStorage.removeItem('np_current_payment');
                  localStorage.removeItem('np_current_payment');
                  // Call the parent's onCancel handler
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
