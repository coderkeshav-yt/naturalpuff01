// @ts-ignore: Deno-specific imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore: Deno-specific imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to check payment with Razorpay API
async function checkRazorpayPayment(orderId: string, razorpayKeyId: string, razorpayKeySecret: string) {
  try {
    // Base64 encode the API key and secret for Basic Auth
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    // First try to find payments by notes.order_id
    const paymentsResponse = await fetch('https://api.razorpay.com/v1/payments?count=10', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!paymentsResponse.ok) {
      throw new Error(`Razorpay API error: ${paymentsResponse.status} ${paymentsResponse.statusText}`)
    }
    
    const payments = await paymentsResponse.json()
    
    // Find payment for this order
    const payment = payments.items.find((p: any) => 
      p.notes && p.notes.order_id === orderId
    )
    
    if (payment) {
      return {
        found: true,
        status: payment.status,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        vpa: payment.vpa, // For UPI payments
        bank: payment.bank, // For netbanking
        wallet: payment.wallet, // For wallet payments
        captured: payment.captured,
        created_at: payment.created_at
      }
    }
    
    return { found: false }
  } catch (error) {
    console.error('Error checking Razorpay payment:', error)
    return { found: false, error: error.message }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { orderId } = await req.json()
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Create Supabase client
    // @ts-ignore: Deno-specific API
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    // @ts-ignore: Deno-specific API
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get Razorpay credentials from environment variables
    // @ts-ignore: Deno-specific API
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    // @ts-ignore: Deno-specific API
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // First check the order status in our database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_id, payment_status')
      .eq('id', orderId)
      .single()
    
    if (orderError) {
      console.error('Error fetching order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order details', details: orderError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    // If the order is already marked as paid in our database, return success
    if (orderData.status === 'paid' || orderData.payment_status === 'paid') {
      console.log('Order already marked as paid in database')
      
      // Extract payment details if available
      let paymentId = 'database_verified'
      let signature = 'database_verified'
      
      if (orderData.payment_id) {
        try {
          const paymentData = JSON.parse(orderData.payment_id)
          paymentId = paymentData.razorpay_payment_id || paymentId
          signature = paymentData.razorpay_signature || signature
        } catch (e) {
          console.error('Error parsing payment data:', e)
        }
      }
      
      return new Response(
        JSON.stringify({
          status: 'paid',
          orderId,
          paymentId,
          signature,
          message: 'Payment already completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If the order is not paid, check with Razorpay API directly
    console.log('Checking payment status with Razorpay API for order:', orderId)
    const paymentResult = await checkRazorpayPayment(orderId, razorpayKeyId, razorpayKeySecret)
    
    console.log('Razorpay payment check result:', paymentResult)
    
    if (paymentResult.found) {
      // Payment was found in Razorpay
      if (paymentResult.status === 'authorized' || paymentResult.status === 'captured') {
        // Payment is successful but our database doesn't know it yet
        // Update the order status in our database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            payment_id: JSON.stringify({
              razorpay_payment_id: paymentResult.paymentId,
              payment_method: paymentResult.method,
              payment_status: 'paid',
              payment_date: new Date().toISOString(),
              verified_by_server: true,
              payment_details: paymentResult
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
        
        if (updateError) {
          console.error('Error updating order status:', updateError)
        } else {
          console.log('Successfully updated order status to paid')
        }
        
        // Return success response
        return new Response(
          JSON.stringify({
            status: 'success',
            orderId,
            paymentId: paymentResult.paymentId,
            method: paymentResult.method,
            message: 'Payment successful',
            details: paymentResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (paymentResult.status === 'failed') {
        // Payment failed
        // Update the order status in our database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'payment_failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
        
        if (updateError) {
          console.error('Error updating order status to failed:', updateError)
        }
        
        return new Response(
          JSON.stringify({
            status: 'failed',
            orderId,
            paymentId: paymentResult.paymentId,
            method: paymentResult.method,
            message: 'Payment failed',
            details: paymentResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Payment is in some other state (created, refunded, etc.)
        return new Response(
          JSON.stringify({
            status: 'pending',
            orderId,
            paymentId: paymentResult.paymentId,
            method: paymentResult.method,
            message: `Payment is in ${paymentResult.status} state`,
            details: paymentResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    // No payment found in Razorpay
    return new Response(
      JSON.stringify({
        status: 'pending',
        orderId,
        message: 'No payment found for this order',
        error: paymentResult.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
