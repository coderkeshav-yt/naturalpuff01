
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category?: string;
  nutritional_info?: string;
  details?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number | null;
  nutritional_info: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiprocketOrder {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  payment_method: string;
  shipping_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  order_items: ShiprocketOrderItem[];
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount: number;
  tax: number;
}

export interface ShiprocketServiceability {
  available: boolean;
  cod: boolean;
  courier_code: string;
  courier_name: string;
  etd: string;
  rate: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Add new interface for product variants
export interface ProductVariant {
  size: string;
  price: number;
  stock?: number;
}

// Add new interface for marketing offers
export interface MarketingOffer {
  id: number;
  title: string;
  description: string;
  image_url: string;
  expires_at: string;
  created_at: string;
}
