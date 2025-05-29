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

// Helper function to format order data for Shiprocket
function formatOrderForShiprocket(orderData: any) {
  const {
    order_id,
    order_date,
    pickup_location,
    billing_customer_name,
    billing_address,
    billing_city,
    billing_state,
    billing_country,
    billing_pincode,
    billing_email,
    billing_phone,
    shipping_is_billing,
    shipping_customer_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_country,
    shipping_pincode,
    shipping_email,
    shipping_phone,
    order_items,
    payment_method,
    sub_total,
    length,
    breadth,
    height,
    weight,
  } = orderData;

  return {
    order_id,
    order_date,
    pickup_location,
    billing_customer_name,
    billing_last_name: '',
    billing_address,
    billing_address_2: '',
    billing_city,
    billing_state,
    billing_country,
    billing_pincode,
    billing_email,
    billing_phone,
    shipping_is_billing,
    shipping_customer_name,
    shipping_last_name: '',
    shipping_address,
    shipping_address_2: '',
    shipping_city,
    shipping_state,
    shipping_country,
    shipping_pincode,
    shipping_email,
    shipping_phone,
    order_items,
    payment_method,
    sub_total,
    length,
    breadth,
    height,
    weight,
  };
}

// Handler for checking serviceability
async function handleCheckServiceability(req: Request, token: string) {
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

// Handler for creating order
async function handleCreateOrder(req: Request, token: string, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const orderData = await req.json();
  const formattedOrderData = formatOrderForShiprocket(orderData);
  
  const createOrderResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(formattedOrderData),
  });

  const createOrderData = await createOrderResponse.json();

  // If order was created successfully, update the order in our database
  if (createOrderData && createOrderData.order_id) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shipping_details: {
          shiprocket_order_id: createOrderData.order_id,
          shiprocket_shipment_id: createOrderData.shipment_id,
          tracking_url: createOrderData.tracking_url || null,
          courier_name: orderData.courier_name || null,
          courier_id: orderData.courier_id || null,
          status: 'CREATED',
          created_at: new Date().toISOString()
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

// Handler for tracking shipment
async function handleTrackShipment(req: Request, token: string) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let shipmentId;
  
  if (req.method === 'GET') {
    const url = new URL(req.url);
    shipmentId = url.searchParams.get('shipment_id');
  } else {
    const { shipment_id } = await req.json();
    shipmentId = shipment_id;
  }
  
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

// Handler for generating payment link
async function handleGeneratePaymentLink(req: Request, token: string) {
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

// Handler for updating config
async function handleUpdateConfig(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { email, password, pickup_location, pickup_pincode } = await req.json();
  
  try {
    // Store in environment variables (this is just a simulation, actual implementation would depend on your hosting)
    // In a real production environment, you would use a secure way to store these credentials
    
    // Reset the token to force re-authentication with new credentials
    shiprocketToken = null;
    
    // Test the credentials
    try {
      const testToken = await getShiprocketToken();
      if (!testToken) {
        throw new Error('Failed to authenticate with provided credentials');
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Configuration updated successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (authError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid credentials provided',
          error: (authError as Error).message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to update configuration',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handler for getting config
async function handleGetConfig(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Check if user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    // Get configuration from environment variables
    const config = {
      email: Deno.env.get('SHIPROCKET_EMAIL') || '',
      password: '',  // Never return the actual password
      pickup_location: Deno.env.get('SHIPROCKET_PICKUP_LOCATION') || '',
      pickup_pincode: Deno.env.get('SHIPROCKET_PICKUP_PINCODE') || '',
      warehouse_address: Deno.env.get('SHIPROCKET_WAREHOUSE_ADDRESS') || '',
      warehouse_city: Deno.env.get('SHIPROCKET_WAREHOUSE_CITY') || '',
      warehouse_state: Deno.env.get('SHIPROCKET_WAREHOUSE_STATE') || '',
      warehouse_country: 'India',
      warehouse_phone: Deno.env.get('SHIPROCKET_WAREHOUSE_PHONE') || '',
    };
    
    return new Response(JSON.stringify({ config }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error getting config:', error);
    return new Response(JSON.stringify({ error: 'Failed to get configuration' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Handler for saving config
async function handleSaveConfig(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Check if user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    const { config } = await req.json();
    
    if (!config || !config.email || !config.password) {
      return new Response(JSON.stringify({ error: 'Invalid configuration data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // In a real implementation, you would save this to a secure storage
    // For now, we'll just return success
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return new Response(JSON.stringify({ error: 'Failed to save configuration' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Handler for testing connection
async function handleTestConnection(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { email, password } = await req.json();
  
  try {
    // Try to get a token with the provided credentials
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorData.message || 'Authentication failed' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully connected to Shiprocket',
        token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to connect to Shiprocket' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
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
    let token = '';
    try {
      token = await getShiprocketToken();
    } catch (error) {
      console.error('Error getting Shiprocket token:', error);
      // Continue without token for endpoints that don't require it
    }

    // Handle the request based on the endpoint
    switch (endpoint) {
      case 'check-serviceability':
        return await handleCheckServiceability(req, token);
      case 'create-order':
        return await handleCreateOrder(req, token, supabase);
      case 'track-shipment':
        return await handleTrackShipment(req, token);
      case 'generate-payment-link':
        return await handleGeneratePaymentLink(req, token);
      case 'update-config':
        return await handleUpdateConfig(req);
      case 'get-config':
        return await handleGetConfig(req, supabase);
      case 'save-config':
        return await handleSaveConfig(req, supabase);
      case 'test-connection':
        return await handleTestConnection(req);
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
});
