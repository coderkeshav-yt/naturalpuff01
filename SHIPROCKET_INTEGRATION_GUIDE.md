# Shiprocket Integration Guide for Natural Puff

This guide outlines the steps to complete and test the Shiprocket integration for your e-commerce platform.

## 1. Environment Setup

### Create a `.env.local` file

Create a `.env.local` file in the project root with the following variables:

```
# Shiprocket API Credentials
NEXT_PUBLIC_SHIPROCKET_EMAIL=your_email@example.com
NEXT_PUBLIC_SHIPROCKET_PASSWORD=your_password_here
NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE=110001
NEXT_PUBLIC_SHIPROCKET_PICKUP_LOCATION=Primary
NEXT_PUBLIC_WAREHOUSE_ADDRESS="Your Warehouse Address"
NEXT_PUBLIC_WAREHOUSE_CITY="Your City"
NEXT_PUBLIC_WAREHOUSE_STATE="Your State"
NEXT_PUBLIC_WAREHOUSE_PHONE="1234567890"
NEXT_PUBLIC_COMPANY_NAME="Natural Puff"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deploy Supabase Edge Function

1. If you're using the Supabase CLI:
   ```bash
   cd supabase/functions/shiprocket
   npx supabase functions deploy shiprocket
   ```

2. If you're not using the CLI, manually upload the function through the Supabase dashboard:
   - Go to Supabase Dashboard > Edge Functions
   - Create a new function named "shiprocket"
   - Upload the contents of `supabase/functions/shiprocket/index.ts`

### Run Database Migrations

Execute the SQL migrations to create the necessary database structure:

1. Go to the Supabase Dashboard > SQL Editor
2. Run the contents of:
   - `supabase/migrations/20250529_create_shiprocket_functions.sql`
   - `supabase/migrations/20250529_update_orders_for_shipping.sql`

## 2. Admin Configuration

1. Navigate to `/dashboard/shiprocket` in your application
2. Enter your Shiprocket credentials and warehouse details
3. Click "Test Connection" to verify your credentials
4. Save the configuration

## 3. Integration Components

### Checkout Flow

The Shiprocket integration affects the checkout flow in these ways:

1. **Shipping Address Collection**:
   - Ensure the checkout form collects complete shipping address
   - Validate pincode format (6 digits for Indian pincodes)

2. **Serviceability Check**:
   - Use `ShiprocketService.checkServiceability()` to check if delivery is available
   - Show available courier options to the customer

3. **Order Creation**:
   - After payment is successful, create a Shiprocket order using `ShiprocketService.createOrder()`
   - Store the shipment details in the order's `shipping_details` column

### Order Tracking

1. **Customer View**:
   - Use `ShiprocketTracking` component on the order details page
   - Pass the shipment ID to display tracking information

2. **Admin View**:
   - Use `ShiprocketManager` to manage all shipments
   - Generate labels, invoices, and track shipments

## 4. Testing the Integration

### Test Serviceability Check

1. Enter a valid Indian pincode in the checkout form
2. Verify that courier options are displayed
3. Try an invalid pincode and ensure proper error handling

### Test Order Creation

1. Place a test order with a valid shipping address
2. Verify that the order is created in Shiprocket
3. Check that shipping details are saved in your database

### Test Tracking

1. Use a valid shipment ID to test tracking
2. Verify that tracking information is displayed correctly

## 5. Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check that your Shiprocket credentials are correct
   - Verify that the token is being properly cached and refreshed

2. **Serviceability Issues**:
   - Ensure you're using valid Indian pincodes
   - Check that weight and dimensions are within acceptable ranges

3. **Order Creation Failures**:
   - Verify all required fields are being sent
   - Check for formatting issues in addresses or phone numbers

### Debugging

1. Check browser console for frontend errors
2. Check Supabase logs for edge function errors:
   - Go to Supabase Dashboard > Edge Functions > Logs

## 6. Production Deployment

Before deploying to production:

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Test the entire flow in a staging environment
3. Implement proper error handling and user notifications

## 7. Additional Features

Consider implementing these additional features:

1. **Webhook Handler**:
   - Create a webhook endpoint to receive Shiprocket status updates
   - Update order status automatically

2. **Bulk Shipping**:
   - Add functionality to create multiple shipments at once

3. **Return Management**:
   - Implement return label generation and tracking

## 8. Support and Resources

- [Shiprocket API Documentation](https://apidocs.shiprocket.in/)
- [Shiprocket Dashboard](https://app.shiprocket.in/dashboard)
- [Contact Shiprocket Support](https://support.shiprocket.in/)
