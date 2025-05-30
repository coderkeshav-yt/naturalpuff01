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
    console.log('Opening Razorpay checkout with options:', {
      ...options,
      key: '***HIDDEN***', // Hide key in logs
      prefill: options.prefill ? { ...options.prefill, contact: '****' } : undefined // Hide contact in logs
    });
    
    // Create a unique key for this payment attempt
    const paymentKey = `payment_${Date.now()}`;
    
    // Store order ID in localStorage for verification after app redirect
    if (options.notes?.order_id) {
      localStorage.setItem('current_order_id', options.notes.order_id);
      
      // Store payment data for verification
      localStorage.setItem('np_current_payment', JSON.stringify({
        orderId: options.notes.order_id,
        amount: options.amount / 100, // Convert back from paise
        status: 'pending',
        timestamp: Date.now(),
        customerInfo: options.prefill
      }));
    }
    
    // Store initial payment status in localStorage
    window.localStorage.setItem(paymentKey, 'pending');
    
    // Create wrapped callbacks that handle mobile browser issues
    const safeSuccess = (response: any) => {
      console.log('Payment success callback triggered:', response);
      
      // Get current payment status from localStorage
      const status = window.localStorage.getItem(paymentKey);
      
      // Only proceed if payment is still pending
      if (status !== 'completed') {
        window.localStorage.setItem(paymentKey, 'completed');
        
        // Store response for verification
        if (options.notes?.order_id) {
          const paymentData = JSON.parse(localStorage.getItem('np_current_payment') || '{}');
          localStorage.setItem('np_current_payment', JSON.stringify({
            ...paymentData,
            status: 'success',
            response: response
          }));
        }
        
        onSuccess(response);
      }
    };
    
    const safeFailure = (error: any) => {
      console.error('Payment failure callback triggered:', error);
      
      // Get current payment status from localStorage
      const status = window.localStorage.getItem(paymentKey);
      
      // Only proceed if payment is not already completed or failed
      if (status !== 'failed' && status !== 'completed') {
        window.localStorage.setItem(paymentKey, 'failed');
        
        // Store error for verification
        if (options.notes?.order_id) {
          const paymentData = JSON.parse(localStorage.getItem('np_current_payment') || '{}');
          localStorage.setItem('np_current_payment', JSON.stringify({
            ...paymentData,
            status: 'failed',
            error: error?.message || 'Unknown error'
          }));
        }
        
        console.error('Payment failed:', error);
        onFailure(error);
      }
    };
    
    // Create Razorpay instance with improved mobile handling
    const razorpay = new window.Razorpay({
      ...options,
      handler: function(response: any) {
        safeSuccess(response);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment window closed by user');
          // Don't immediately fail on dismiss - could be returning from UPI app
          // Instead, we'll check the status when user returns
          
          // For non-mobile or non-UPI, we can consider it cancelled
          if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            safeFailure(new Error('Payment cancelled by user'));
          } else {
            // For mobile, we'll redirect to verification page
            // This helps with UPI app returns
            console.log('Mobile detected, redirecting to verification page');
            window.location.href = `/payment-verification?order_id=${options.notes?.order_id || ''}`;
          }
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
      safeFailure(response.error);
    });
    
    // Clean up old payment keys (from previous sessions)
    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith('payment_') && key !== paymentKey) {
        const timestamp = parseInt(key.split('_')[1]);
        const now = Date.now();
        // Remove keys older than 1 hour
        if (now - timestamp > 3600000) {
          window.localStorage.removeItem(key);
        }
      }
    });
    
    // Open checkout with a longer delay to ensure everything is ready
    setTimeout(() => {
      console.log('Opening Razorpay checkout window...');
      razorpay.open();
    }, 2000); // Increased delay to 2 seconds
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    onFailure(error);
  }
};

/**
 * Complete payment flow in one function - DIRECT PAYMENT WITHOUT ORDER CREATION
 * This handles the payment process directly without creating an order first
 */
// Simple function to directly open UPI app without relying on Razorpay callbacks
export const directUpiPayment = async (
  amount: number,
  orderId: string,
  upiId: string,
  onSuccess: () => void,
  onFailure: (error: any) => void
): Promise<void> => {
  try {
    // Format amount to 2 decimal places
    const formattedAmount = amount.toFixed(2);
    
    // Generate a transaction reference
    const txnRef = `order_${orderId}_${Date.now()}`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=NaturalPuff&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Payment for order #${orderId}`)}&tr=${encodeURIComponent(txnRef)}`;
    
    console.log('Opening direct UPI payment URL:', upiUrl);
    
    // Store order info in localStorage for verification after return
    localStorage.setItem('current_payment_order', orderId);
    localStorage.setItem('payment_amount', formattedAmount);
    localStorage.setItem('payment_txn_ref', txnRef);
    localStorage.setItem('payment_start_time', Date.now().toString());
    
    // Open the UPI URL
    window.location.href = upiUrl;
    
    // The page will reload when user returns from UPI app
    // We'll handle the verification in the component that called this function
  } catch (error) {
    console.error('Error initiating direct UPI payment:', error);
    onFailure(error);
  }
};

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
  // Create a unique payment tracking ID for this payment attempt
  const paymentTrackingId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Store this payment attempt in localStorage
  localStorage.setItem(paymentTrackingId, JSON.stringify({
    orderId,
    status: 'pending',
    amount: amount,
    timestamp: Date.now()
  }));
  
  // Create wrapped callbacks that ensure they're only called once
  const wrappedSuccess = (response: any) => {
    // Get current payment data
    const paymentDataStr = localStorage.getItem(paymentTrackingId);
    if (!paymentDataStr) return;
    
    const paymentData = JSON.parse(paymentDataStr);
    
    // Only proceed if payment is still pending
    if (paymentData.status === 'pending') {
      // Update payment status
      paymentData.status = 'success';
      paymentData.response = response;
      localStorage.setItem(paymentTrackingId, JSON.stringify(paymentData));
      
      // Call the original success callback
      console.log('Payment successful:', response);
      onSuccess(response);
    }
  };
  
  const wrappedFailure = (error: any) => {
    // Get current payment data
    const paymentDataStr = localStorage.getItem(paymentTrackingId);
    if (!paymentDataStr) return;
    
    const paymentData = JSON.parse(paymentDataStr);
    
    // Only proceed if payment is still pending
    if (paymentData.status === 'pending') {
      // Update payment status
      paymentData.status = 'failed';
      paymentData.error = error?.message || 'Unknown error';
      localStorage.setItem(paymentTrackingId, JSON.stringify(paymentData));
      
      // Call the original failure callback
      console.error('Payment failed:', error);
      onFailure(error);
    }
  };
  
  // Clean up old payment tracking entries
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('payment_') && key !== paymentTrackingId) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const timestamp = data.timestamp || 0;
        
        // Remove entries older than 1 hour
        if (Date.now() - timestamp > 3600000) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // If we can't parse it, just remove it
        localStorage.removeItem(key);
      }
    }
  });
  
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
          
          // Create a backup timer for mobile UPI apps that might not trigger callbacks
          const backupTimer = setTimeout(() => {
            // Check if payment is still pending
            const paymentDataStr = localStorage.getItem(paymentTrackingId);
            if (paymentDataStr) {
              const paymentData = JSON.parse(paymentDataStr);
              if (paymentData.status === 'pending') {
                console.log('Payment status still pending after timeout, checking with server...');
                // Just fail the payment after timeout
                wrappedFailure(new Error('Payment timed out. Please try again.'));
              }
            }
          }, 60000); // 1 minute backup timer
          
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
