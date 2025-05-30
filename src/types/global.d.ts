// Global type declarations for the application

interface Window {
  Razorpay: any;
  __razorpayCallbacks?: {
    [orderId: string]: {
      success: (response: any) => void;
      failure: (error: any) => void;
    }
  };
  handleUpiReturn?: (orderId: string) => void;
}

// Add Razorpay types
interface RazorpayOptions {
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
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
    animation?: boolean;
  };
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
  timeout?: number;
  remember_customer?: boolean;
}
