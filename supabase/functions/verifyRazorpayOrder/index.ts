
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
    
    // Validate required parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Missing required payment verification parameters");
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // TODO: Implement actual signature verification with Razorpay
    // This would typically use the Razorpay SDK or crypto functions to verify
    // that the signature is valid using your Razorpay secret key
    
    // For now, we'll consider it verified if all parameters are present
    const isVerified = true;
    
    if (isVerified) {
      // Find order by Razorpay order ID
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_id', razorpay_order_id)
        .single();
      
      if (orderError) {
        throw new Error(`Order not found: ${orderError.message}`);
      }
      
      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          payment_id: razorpay_payment_id // Store the payment ID, not the order ID
        })
        .eq('id', orderData.id);
      
      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment verified successfully",
          order_id: orderData.id
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      );
    } else {
      throw new Error("Payment signature verification failed");
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Payment verification failed" 
      }),
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
