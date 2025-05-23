
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
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
    // Parse request body
    const { orderId, customerName, amount, email, phone, items = [] } = await req.json();

    // Validate required fields
    if (!orderId || !customerName || !amount) {
      throw new Error("Missing required fields");
    }

    // Get environment variables
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || gmailUser;

    if (!gmailUser || !gmailPass) {
      throw new Error("Email credentials are not configured");
    }

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to Gmail's SMTP server
    await client.connectTLS({
      host: "smtp.gmail.com",
      port: 465,
      username: gmailUser,
      password: gmailPass,
    });

    // Format items list
    const itemsList = items.map((item: any) => 
      `- ${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`
    ).join('\n');

    // Create email content
    const htmlBody = `
      <h1>New Order Notification</h1>
      <p>A new order has been placed on your website.</p>
      <h2>Order Details:</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${email || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Total Amount:</strong> ₹${amount}</p>
      
      ${items.length > 0 ? `
        <h3>Items:</h3>
        <ul>
          ${items.map((item: any) => 
            `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`
          ).join('')}
        </ul>
      ` : ''}
      
      <p>Please log in to your admin dashboard to process this order.</p>
    `;

    // Send email
    await client.send({
      from: gmailUser,
      to: adminEmail,
      subject: `New Order #${orderId} - ₹${amount}`,
      content: "New order notification",
      html: htmlBody,
    });

    // Close connection
    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order notification email sent successfully" 
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
    console.error('Error sending notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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
