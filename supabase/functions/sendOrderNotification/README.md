# Order Email Notification System

This Supabase Edge Function sends email notifications to the admin whenever a new order is placed on the Natural Puff website.

## Setup Instructions

1. **Create a Gmail App Password**:
   - Go to your Google Account settings: https://myaccount.google.com/
   - Navigate to Security > 2-Step Verification > App passwords
   - Create a new app password for "Natural Puff Website"
   - Copy the generated password (this will be your `GMAIL_APP_PASSWORD`)

2. **Configure Environment Variables**:
   - Edit the `.env` file in this directory with your actual email credentials:
     ```
     # Email account used for SENDING notifications (needs App Password)
     GMAIL_USER=your-sending-email@gmail.com
     GMAIL_APP_PASSWORD=your-16-character-app-password
     
     # Email address where you want to RECEIVE order notifications (can be any email)
     ADMIN_EMAIL=your-receiving-email@gmail.com
     ```
   - The `GMAIL_USER` is the account that will be used to send emails (requires App Password)
   - The `ADMIN_EMAIL` is where you'll receive notifications (can be any email address)
   - If `ADMIN_EMAIL` is not specified, notifications will be sent to the `GMAIL_USER` email

3. **Deploy the Function**:
   - Deploy the function to your Supabase project:
     ```
     npx supabase functions deploy sendOrderNotification --project-ref your-project-ref
     ```
   - Set the secrets on your Supabase project:
     ```
     npx supabase secrets set --env-file ./supabase/functions/sendOrderNotification/.env --project-ref your-project-ref
     ```

## Testing the Function

You can test the function by sending a POST request with order data:

```json
{
  "orderId": "TEST123",
  "customerName": "Test Customer",
  "amount": 1299,
  "email": "customer@example.com",
  "phone": "9876543210",
  "items": [
    {
      "name": "Natural Puff - Herbal 50g",
      "quantity": 2,
      "price": 499
    },
    {
      "name": "Natural Puff - Spicy 100g",
      "quantity": 1,
      "price": 899
    }
  ]
}
```

## Troubleshooting

- **Email Not Sending**: Check if your Gmail app password is correct and that "Less secure app access" is enabled in your Google account
- **Function Errors**: Check the Supabase Edge Function logs in your Supabase dashboard
- **SMTP Connection Issues**: Make sure your network allows outgoing connections on port 465 (SMTP SSL)

## Email Template

The email template includes:
- Order details (ID, customer info, amount)
- Itemized list of products
- Formatted date and currency values
- Responsive HTML design for better readability

You can customize the email template by editing the `htmlBody` variable in the function code.
