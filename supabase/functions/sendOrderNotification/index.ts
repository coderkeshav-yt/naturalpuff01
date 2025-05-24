
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, authorization, x-client-info, apikey',
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
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
    // Enable detailed logging if DEBUG_MODE is true
    // @ts-ignore: Deno exists in Supabase Edge Functions environment
    const debugMode = Deno.env.get('DEBUG_MODE') === 'true';
    
    if (debugMode) {
      console.log('Starting order notification process...');
      console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    }
    
    // Parse request body
    const requestBody = await req.json();
    const { orderId, customerName, amount, email, phone, items = [] } = requestBody;
    
    if (debugMode) {
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
    }

    // Validate required fields
    if (!orderId || !customerName || !amount) {
      throw new Error("Missing required fields: " + 
        (!orderId ? 'orderId ' : '') + 
        (!customerName ? 'customerName ' : '') + 
        (!amount ? 'amount' : ''));
    }

    // Get environment variables
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || gmailUser;

    if (debugMode) {
      console.log('Email configuration:', {
        gmailUser: gmailUser ? `${gmailUser.substring(0, 3)}...` : 'not set',
        gmailPass: gmailPass ? `${gmailPass.length} chars` : 'not set',
        adminEmail: adminEmail ? `${adminEmail.substring(0, 3)}...` : 'not set',
      });
    }

    if (!gmailUser || !gmailPass) {
      throw new Error("Email credentials are not configured");
    }

    // Create SMTP client
    const client = new SmtpClient();
    
    // Function to attempt SMTP connection with retries
    const connectWithRetry = async (retries = 3, delay = 2000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          if (debugMode) console.log(`Connecting to SMTP server (attempt ${attempt}/${retries})...`);
          
          // Connect to Gmail's SMTP server with a timeout
          await Promise.race([
            client.connectTLS({
              host: "smtp.gmail.com",
              port: 465,
              username: gmailUser,
              password: gmailPass,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SMTP connection timeout')), 20000) // Increased timeout
            )
          ]);
          
          if (debugMode) console.log('Successfully connected to SMTP server');
          return; // Connection successful, exit the function
        } catch (smtpError) {
          console.error(`SMTP connection error (attempt ${attempt}/${retries}):`, smtpError);
          
          if (attempt === retries) {
            // Last attempt failed, throw the error
            throw new Error(`Failed to connect to email server after ${retries} attempts: ${smtpError.message}`);
          }
          
          // Wait before next retry
          if (debugMode) console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    
    // Try to connect with retry logic
    await connectWithRetry();

    // Format items list
    const itemsList = items.map((item: any) => 
      `- ${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`
    ).join('\n');

    // Create email content with better styling
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745; }
          .content { padding: 20px; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Order Notification</h1>
          <p>Order #${orderId} | ${formatDate(new Date())}</p>
        </div>
        
        <div class="content">
          <p>A new order has been placed on your Natural Puff website.</p>
          
          <div class="order-details">
            <h2>Order Details:</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Total Amount:</strong> ${formatCurrency(amount)}</p>
          </div>
          
          ${items.length > 0 ? `
            <h3>Order Items:</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">Total</td>
                  <td>${formatCurrency(amount)}</td>
                </tr>
              </tbody>
            </table>
          ` : '<p>No items in this order.</p>'}
          
          <p>Please log in to your admin dashboard to process this order.</p>
          
          <div class="footer">
            <p>This is an automated notification from your Natural Puff website.</p>
            <p>© ${new Date().getFullYear()} Natural Puff. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to admin
    if (debugMode) console.log('Sending order notification to admin...');
    await client.send({
      from: gmailUser,
      to: adminEmail,
      subject: `New Order #${orderId} - ₹${amount}`,
      content: "New order notification",
      html: htmlBody,
    });
    
    // Also send a confirmation email to the customer if email is provided
    if (email) {
      if (debugMode) console.log('Sending order confirmation to customer...');
      
      // Create customer email content
      const customerHtmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745; }
            .content { padding: 20px; }
            .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your order with Natural Puff. We've received your order and it's being processed.</p>
            
            <div class="order-details">
              <h2>Order Details:</h2>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Date:</strong> ${formatDate(new Date())}</p>
              <p><strong>Total Amount:</strong> ${formatCurrency(amount)}</p>
            </div>
            
            ${items.length > 0 ? `
              <h3>Your Order:</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item: any) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="3">Total</td>
                    <td>${formatCurrency(amount)}</td>
                  </tr>
                </tbody>
              </table>
            ` : '<p>No items in this order.</p>'}
            
            <p>We'll process your order as soon as possible. If you have any questions, please reply to this email.</p>
            
            <div class="footer">
              <p>Thank you for shopping with Natural Puff!</p>
              <p>© ${new Date().getFullYear()} Natural Puff. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      try {
        await client.send({
          from: gmailUser,
          to: email,
          subject: `Your Natural Puff Order #${orderId} Confirmation`,
          content: "Order confirmation",
          html: customerHtmlBody,
        });
        if (debugMode) console.log('Customer confirmation email sent successfully');
      } catch (customerEmailError) {
        console.error('Failed to send customer confirmation email:', customerEmailError);
        // Continue even if customer email fails - at least admin was notified
      }
    }

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
