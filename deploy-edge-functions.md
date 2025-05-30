# Deploying Supabase Edge Functions

## Prerequisites
1. Make sure you have the Supabase CLI installed
2. Login to your Supabase account

## Steps to Deploy the Edge Functions

### 1. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link your project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```
Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

### 4. Deploy the Edge Functions
```bash
supabase functions deploy checkRazorpayPaymentStatus
```

### 5. Set Environment Variables
Make sure to set these environment variables in your Supabase project:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

You can set them in the Supabase dashboard under Project Settings > API > Edge Functions.

## Testing the Function
After deployment, you can test the function by making a POST request to:
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/checkRazorpayPaymentStatus
```

With a JSON body like:
```json
{
  "orderId": "your-order-id"
}
```
