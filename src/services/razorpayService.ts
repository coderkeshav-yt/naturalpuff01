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
    
    // Create Razorpay instance
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
        }
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
    
    // Step 2: Get the Razorpay key from environment
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_qJB7Gu8slTfsRH';
    if (!key) {
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
          // Step 4: Open the payment window directly
          openRazorpayCheckout(options, onSuccess, onFailure);
          console.log('Razorpay checkout opened successfully');
          resolve();
        } catch (err) {
          console.error('Error during Razorpay checkout opening:', err);
          onFailure(err);
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
