// Script to deploy the SQL function to Supabase
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase API credentials
const SUPABASE_URL = 'https://nmpaafoonvivsdxcbaoe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcGFhZm9vbnZpdnNkeGNiYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTYzOTcsImV4cCI6MjA2MTQ3MjM5N30.iAB0e2wl-TwGlFcE8gqCTgyUxFj7i9HSKv-bKMod8nU';

async function main() {
  try {
    // Read SQL file
    const sqlFilePath = join(__dirname, 'src', 'sql', 'create_sales_inquiries_table.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL content loaded successfully');
    
    // Execute SQL directly via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_sales_inquiries_table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({})
    });
    
    console.log('SQL function execution response status:', response.status);
    
    if (response.ok) {
      console.log('SQL function executed successfully');
    } else {
      const errorText = await response.text();
      console.error('Error executing SQL function:', errorText);
    }
    
    // Check if the table exists
    const tableCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries?limit=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Table check response status:', tableCheckResponse.status);
    
    if (tableCheckResponse.ok) {
      console.log('Table exists and is accessible');
    } else {
      console.error('Table does not exist or is not accessible');
    }
    
    // Try to insert a test record
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      company: 'Test Company',
      location: 'Test Location',
      order_size: 'Small',
      message: 'This is a test message',
      created_at: new Date().toISOString(),
      responded: false,
      notes: null,
      responded_at: null
    };
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Insert test record response status:', insertResponse.status);
    
    if (insertResponse.ok) {
      console.log('Test record inserted successfully');
    } else {
      const errorText = await insertResponse.text();
      console.error('Error inserting test record:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
