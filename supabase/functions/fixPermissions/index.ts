
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Execute SQL to configure product RLS policies
    const { error: productRlsError } = await supabaseClient.rpc('configure_product_rls_policies');
    if (productRlsError) {
      throw new Error(`Error configuring product RLS: ${productRlsError.message}`);
    }
    
    // Execute SQL to configure coupon RLS policies
    const { error: couponRlsError } = await supabaseClient.rpc('configure_coupon_rls_policies');
    if (couponRlsError) {
      throw new Error(`Error configuring coupon RLS: ${couponRlsError.message}`);
    }
    
    // Execute SQL to configure order RLS policies
    const { error: orderRlsError } = await supabaseClient.rpc('configure_order_rls_policies');
    if (orderRlsError) {
      throw new Error(`Error configuring order RLS: ${orderRlsError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Permissions fixed successfully",
        details: {
          product_policies: "configured",
          coupon_policies: "configured",
          order_policies: "configured"
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error fixing permissions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
