// This is a simple proxy API endpoint for creating Razorpay orders
// It's designed to be called from the standalone payment page

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get request body
    const { amount, currency = 'INR', receipt = '', notes = {} } = req.body;
    
    if (!amount) {
      throw new Error('Amount is required');
    }
    
    // Configure Razorpay API credentials
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_qJB7Gu8slTfsRH';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'SecretTe13Rl3LtTpFPHSx9bFGO7ub';
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured');
    }
    
    // Basic auth for Razorpay API
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    // Call Razorpay API to create order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.description || 'Failed to create order');
    }
    
    // Return success response
    res.status(200).json({ data });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
