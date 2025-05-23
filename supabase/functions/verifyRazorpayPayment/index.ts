
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.167.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-razorpay-signature, authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    
    // Check if this is a webhook from Razorpay
    const signature = req.headers.get("x-razorpay-signature");
    if (signature) {
      return handleWebhook(requestData, signature);
    }
    
    // If not a webhook, validate a payment made by customer
    return validatePayment(requestData);
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

async function handleWebhook(payload: any, signature: string) {
  try {
    // Verify signature
    const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!razorpayWebhookSecret) {
      throw new Error("Razorpay webhook secret is not configured");
    }

    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);
    const key = encoder.encode(razorpayWebhookSecret);
    
    const hmac = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    
    const verified = await crypto.subtle.verify(
      "HMAC",
      hmac,
      signatureBytes,
      data
    );

    if (!verified) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Process the webhook
    console.log("Verified webhook from Razorpay:", payload.event);
    
    // Process the payment based on the event type
    // For example, update order status in database

    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Webhook processed successfully"
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

async function validatePayment(data: any) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing required payment verification parameters");
    }
    
    // Get the key secret
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay key secret is not configured");
    }
    
    // Generate the signature
    const encoder = new TextEncoder();
    const message = razorpay_order_id + "|" + razorpay_payment_id;
    const messageBytes = encoder.encode(message);
    const keyBytes = encoder.encode(razorpayKeySecret);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageBytes);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures - Razorpay signatures are case-insensitive
    const verified = signatureHex.toLowerCase() === razorpay_signature.toLowerCase();
    
    if (!verified) {
      console.error('Signature verification failed:', {
        generatedSignature: signatureHex,
        providedSignature: razorpay_signature
      });
      return new Response(
        JSON.stringify({ error: "Payment validation failed: Invalid signature" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Payment verified successfully",
        data: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error validating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
