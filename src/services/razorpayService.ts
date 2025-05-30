import { supabase } from '@/integrations/supabase/client';

/**
 * Simple Razorpay service with minimal dependencies and direct approach
 * This is a complete rewrite to fix payment integration issues
 */

// Type definitions
export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

export type RazorpayPaymentOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

/**
 * Load the Razorpay script directly
 * This is the most reliable way to load the script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // If already loaded, return immediately
    if (window.Razorpay) {
      console.log('Razorpay script already loaded');
      resolve(true);
      return;
    }
    
    console.log('Loading Razorpay script...');
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    // Set up handlers
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    
    // Add to document
    document.body.appendChild(script);
  });
};

/**
 * Check payment status with the server
 * This is used when a user returns from a UPI app without proper callback
 */
export const checkPaymentStatus = async (
  orderId: string,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
): Promise<void> => {
  try {
    console.log(`Checking payment status for order ${orderId}...`);
    
    // Call the Supabase Edge Function to check payment status
    const { data, error } = await supabase.functions.invoke('checkRazorpayPaymentStatus', {
      body: { orderId }
    });
    
    if (error) {
      console.error('Error checking payment status:', error);
      onFailure(new Error(`Failed to check payment status: ${error.message}`));
      return;
    }
    
    console.log('Payment status check response:', data);
    
    if (data?.status === 'paid' || data?.status === 'success') {
      // Payment was successful
      console.log('Payment was successful according to server check');
      onSuccess({
        razorpay_payment_id: data.paymentId || 'server_verified',
        razorpay_order_id: data.orderId || orderId,
        razorpay_signature: data.signature || 'server_verified',
        verified_by_server: true
      });
    } else if (data?.status === 'pending') {
      // Payment is still processing
      console.log('Payment is still processing, showing retry options');
      onFailure(new Error('Payment is still processing. Please check your UPI app or try again.'));
    } else {
      // Payment failed or unknown status
      console.log('Payment failed or unknown status:', data?.status);
      onFailure(new Error('Payment verification failed. Please try again.'));
    }
  } catch (error) {
    console.error('Error in payment status check:', error);
    onFailure(error);
  }
};

/**
 * Create a Razorpay order using the Supabase Edge Function
 */
export const createOrder = async (
  amount: number,
  orderId: string,
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<RazorpayOrder | null> => {
  try {
    console.log('Creating Razorpay order for amount:', amount);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('createRazorpayOrder', {
      body: {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${orderId}`,
        notes: { 
          order_id: orderId,
          customer_name: customerInfo?.name || '',
          customer_email: customerInfo?.email || ''
        }
      }
    });
    
    if (error) {
      console.error('Error creating Razorpay order:', error);
      return null;
    }
    
    if (!data || !data.data || !data.data.id) {
      console.error('Invalid response from order creation:', data);
      return null;
    }
    
    console.log('Razorpay order created successfully:', data.data.id);
    return data.data;
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    return null;
  }
};

/**
 * Open the Razorpay payment window
 * This uses a direct approach with minimal dependencies
 */
export const openRazorpayCheckout = (
  options: RazorpayPaymentOptions,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
): void => {
  try {
    // Ensure Razorpay is loaded
    if (!window.Razorpay) {
      throw new Error('Razorpay is not loaded. Please call loadRazorpayScript first.');
    }
    
    // Create Razorpay instance with improved mobile handling
    const razorpay = new window.Razorpay({
      ...options,
      handler: function(response: any) {
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment window closed by user');
          onFailure(new Error('Payment cancelled by user'));
        },
        escape: false,  // Prevent escape key from closing modal
        confirm_close: true, // Ask for confirmation when closing
        animation: true // Enable animations
      },
      retry: {
        enabled: true,
        max_count: 3
      },
      timeout: 300, // 5 minutes timeout
      remember_customer: true,
      prefill: options.prefill || {}, // Ensure prefill is always defined
      theme: {
        color: options.theme?.color || '#167152',
        backdrop_color: 'rgba(0, 0, 0, 0.7)'
      }
    });
    
    // Add payment failure handler
    razorpay.on('payment.failed', function(response: any) {
      console.error('Payment failed:', response.error);
      onFailure(response.error);
    });
    
    // Open checkout with a longer delay to ensure everything is ready
    // Increasing the delay to 1500ms to give more time for initialization
    setTimeout(() => {
      console.log('Opening Razorpay checkout window...');
      razorpay.open();
    }, 1500);
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    onFailure(error);
  }
};

/**
 * Complete payment flow in one function - DIRECT PAYMENT WITHOUT ORDER CREATION
 * This handles the payment process directly without creating an order first
 */
export const processPayment = async (
  amount: number,
  orderId: string,
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  },
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
): Promise<void> => {
  // Set up a global payment status check for mobile UPI apps
  // This handles cases where the app returns to the browser without proper callback
  const paymentStatusCheckId = `payment_check_${orderId}`;
  window.localStorage.setItem(paymentStatusCheckId, 'pending');
  
  // Set up a listener for visibility changes (when user returns from UPI app)
  const visibilityHandler = () => {
    if (!document.hidden && window.localStorage.getItem(paymentStatusCheckId) === 'pending') {
      console.log('User returned from UPI app, checking payment status...');
      // Wait a moment for any normal callbacks to process
      setTimeout(() => {
        const currentStatus = window.localStorage.getItem(paymentStatusCheckId);
        if (currentStatus === 'pending') {
          console.log('Payment status still pending after return, checking with server...');
          checkPaymentStatus(orderId, onSuccess, onFailure);
        }
      }, 3000);
    }
  };
  
  document.addEventListener('visibilitychange', visibilityHandler);
  
  // Clean up function to remove event listeners
  const cleanup = () => {
    document.removeEventListener('visibilitychange', visibilityHandler);
    window.localStorage.removeItem(paymentStatusCheckId);
  };
  
  // Override success and failure handlers to clean up
  const wrappedSuccess = (response: any) => {
    window.localStorage.setItem(paymentStatusCheckId, 'success');
    cleanup();
    onSuccess(response);
  };
  
  const wrappedFailure = (error: any) => {
    window.localStorage.setItem(paymentStatusCheckId, 'failed');
    cleanup();
    onFailure(error);
  };
  
  try {
    console.log('Starting direct payment process for order:', orderId);
    console.log('Customer info:', { ...customerInfo, phone: customerInfo.phone.substring(0, 3) + '****' });
    console.log('Amount:', amount);
    
    // Step 1: Load the Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      console.error('Razorpay script failed to load');
      throw new Error('Failed to load Razorpay script');
    }
    
    console.log('Razorpay script loaded successfully');
    
    // Verify Razorpay is available in window
    if (typeof window.Razorpay !== 'function') {
      console.error('Razorpay is not available as a function in window object');
      console.log('Window Razorpay type:', typeof window.Razorpay);
      throw new Error('Razorpay is not properly initialized');
    }
    
    // Step 2: Get the Razorpay key from environment variables
    // Never hardcode API keys directly in the code
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      console.error('Razorpay key not found in environment variables');
      throw new Error('Razorpay key is not configured');
    }
    
    console.log('Using Razorpay key:', key);
    
    // Step 3: Configure payment options for direct payment (without order_id)
    const options: RazorpayPaymentOptions = {
      key,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      name: 'Natural Puff',
      description: `Payment for order #${orderId}`,
      prefill: {
        name: customerInfo.name,
        email: customerInfo.email,
        contact: customerInfo.phone
      },
      notes: {
        order_id: orderId
      },
      theme: {
        color: '#167152'
      }
    };
    
    console.log('Payment options configured:', {
      ...options,
      key: '***HIDDEN***', // Hide key in logs
      amount: options.amount,
      prefill: { ...options.prefill, contact: '****' } // Hide contact in logs
    });
    
    // Add a small delay before opening checkout to ensure DOM is ready
    console.log('Preparing to open payment window...');
    
    // Create a promise to track Razorpay initialization
    const razorpayPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Opening direct payment window...');
        try {
          // Step 4: Open the payment window directly with wrapped handlers
          openRazorpayCheckout(options, wrappedSuccess, wrappedFailure);
          console.log('Razorpay checkout opened successfully');
          
          // Set a backup timer for mobile UPI apps that might not trigger callbacks
          const backupTimer = setTimeout(() => {
            const currentStatus = window.localStorage.getItem(paymentStatusCheckId);
            if (currentStatus === 'pending') {
              console.log('Payment status still pending after timeout, checking with server...');
              checkPaymentStatus(orderId, wrappedSuccess, wrappedFailure);
            }
          }, 60000); // 1 minute backup timer
          
          // Store the backup timer ID so it can be cleared if needed
          window.localStorage.setItem(`${paymentStatusCheckId}_timer`, backupTimer.toString());
          
          resolve();
        } catch (err) {
          console.error('Error during Razorpay checkout opening:', err);
          wrappedFailure(err);
          resolve(); // Resolve anyway to continue execution
        }
      }, 2000); // Increased delay to 2 seconds for better reliability
    });
    
    // Wait for Razorpay to initialize
    await razorpayPromise;
    
  } catch (error) {
    console.error('Payment processing error:', error);
    onFailure(error);
  }
};
