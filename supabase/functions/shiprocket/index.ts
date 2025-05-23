
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShiprocketToken {
  token: string;
  expires?: number;
}

let shiprocketToken: ShiprocketToken | null = null;

async function getShiprocketToken(): Promise<string> {
  // Check if we have a valid cached token
  if (shiprocketToken && shiprocketToken.expires && shiprocketToken.expires > Date.now()) {
    return shiprocketToken.token;
  }

  // No valid token, get a new one
  const email = Deno.env.get('SHIPROCKET_EMAIL') || '';
  const password = Deno.env.get('SHIPROCKET_PASSWORD') || '';

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Shiprocket authentication error:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }

  const data = await response.json();
  
  // Cache the token with expiration (token is valid for 24 hours)
  shiprocketToken = {
    token: data.token,
    expires: Date.now() + 23 * 60 * 60 * 1000, // 23 hours in milliseconds
  };

  return data.token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Validate required env variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    // Get authentication token for Shiprocket API
    const token = await getShiprocketToken();

    switch (endpoint) {
      case 'check-serviceability': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { pickup_pincode, delivery_pincode, weight, cod } = await req.json();

        const serviceabilityResponse = await fetch(
          `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickup_pincode}&delivery_postcode=${delivery_pincode}&weight=${weight}&cod=${cod ? 1 : 0}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const serviceabilityData = await serviceabilityResponse.json();

        return new Response(
          JSON.stringify(serviceabilityData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create-order': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const orderData = await req.json();
        
        const createOrderResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        const createOrderData = await createOrderResponse.json();

        // If order was created successfully, update the order in our database
        if (createOrderData && createOrderData.order_id) {
          const { data: updateData, error: updateError } = await supabase
            .from('orders')
            .update({
              shipping_details: {
                shiprocket_order_id: createOrderData.order_id,
                shiprocket_shipment_id: createOrderData.shipment_id,
                tracking_url: createOrderData.tracking_url || null,
              }
            })
            .eq('id', orderData.order_db_id);

          if (updateError) {
            console.error('Error updating order with shipping details:', updateError);
          }
        }

        return new Response(
          JSON.stringify(createOrderData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track': {
        if (req.method !== 'GET') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const shipmentId = url.searchParams.get('shipment_id');
        
        if (!shipmentId) {
          return new Response(
            JSON.stringify({ error: 'Shipment ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const trackResponse = await fetch(
          `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const trackData = await trackResponse.json();

        return new Response(
          JSON.stringify(trackData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate-payment-link': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { order_id, amount, purpose, customer_name, customer_email, customer_phone } = await req.json();
        
        const paymentLinkResponse = await fetch('https://apiv2.shiprocket.in/v1/external/payments/generate-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id,
            amount,
            purpose,
            customer_name,
            customer_email,
            customer_phone
          }),
        });

        const paymentData = await paymentLinkResponse.json();
        
        return new Response(
          JSON.stringify(paymentData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
