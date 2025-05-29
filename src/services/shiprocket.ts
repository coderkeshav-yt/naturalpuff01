import { supabase } from '@/integrations/supabase/client';

interface CourierOption {
  courier_name: string;
  courier_code: string;
  rate: number;
  etd: string;
  serviceability_type: string;
}

interface ShiprocketServiceabilityParams {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  cod: boolean;
}

interface ShiprocketOrderParams {
  order_db_id: string;
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_pincode?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  courier_id?: number;
  courier_name?: string;
}

interface ShiprocketPaymentParams {
  order_id: string;
  amount: number;
  purpose: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface PaymentDetails {
  payment_link_id: string;
  payment_url: string;
  status: string;
}

export const ShiprocketService = {
  /**
   * Check serviceability of a pincode
   */
  async checkServiceability(params: ShiprocketServiceabilityParams): Promise<CourierOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'check-serviceability',
          ...params
        },
        method: 'POST',
      });

      if (error) throw error;
      
      // Parse and format courier options
      if (data && data.data && data.data.available_courier_companies) {
        return data.data.available_courier_companies.map((courier: any) => ({
          courier_name: courier.courier_name,
          courier_code: courier.courier_company_id.toString(),
          rate: courier.rate,
          etd: courier.etd,
          serviceability_type: courier.is_surface ? 'surface' : 'air'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error checking serviceability:', error);
      throw error;
    }
  },

  /**
   * Create a new order in Shiprocket
   */
  async createOrder(params: ShiprocketOrderParams) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'create-order',
          ...params
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Track an order by shipment ID
   */
  async trackOrder(shipmentId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'track-shipment',
          shipment_id: shipmentId
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  },

  /**
   * Generate a payment link for an order
   */
  async generatePaymentLink(params: ShiprocketPaymentParams) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'generate-payment-link',
          ...params
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating payment link:', error);
      throw error;
    }
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, shipmentId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'cancel-order',
          order_id: orderId,
          shipment_id: shipmentId
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'generate-label',
          shipment_id: shipmentId
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating label:', error);
      throw error;
    }
  },

  /**
   * Generate invoice for an order
   */
  async generateInvoice(orderId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: {
          endpoint: 'generate-invoice',
          order_id: orderId
        },
        method: 'POST',
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  },

  /**
   * Update order payment details in Supabase
   */
  async updateOrderPaymentDetails(orderId: string, paymentDetails: PaymentDetails) {
    try {
      return await supabase
        .from('orders')
        .update({ 
          payment_id: JSON.stringify(paymentDetails)
        })
        .eq('id', orderId);
    } catch (error) {
      console.error('Error updating order payment details:', error);
      throw error;
    }
  }
};
