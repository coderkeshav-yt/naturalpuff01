// Netlify function to set up contact messages table in Supabase
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://nmpaafoonvivsdxcbaoe.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if contact_messages table exists
    const { error: tableCheckError } = await supabase
      .from('contact_messages')
      .select('id')
      .limit(1);

    // If table doesn't exist, create it
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      // SQL to create the contact_messages table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.contact_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          responded BOOLEAN DEFAULT false,
          responded_at TIMESTAMP WITH TIME ZONE,
          responded_by UUID REFERENCES auth.users(id),
          notes TEXT
        );

        -- Set up RLS policies
        ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Allow anonymous users to insert new messages
        CREATE POLICY "Allow anonymous message submission" 
          ON public.contact_messages FOR INSERT 
          TO anon 
          WITH CHECK (true);

        -- Allow authenticated users to read all messages
        CREATE POLICY "Allow authenticated users to read messages" 
          ON public.contact_messages FOR SELECT 
          TO authenticated 
          USING (true);

        -- Allow authenticated users to update messages
        CREATE POLICY "Allow authenticated users to update messages" 
          ON public.contact_messages FOR UPDATE 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);
      `;

      // Execute the SQL to create the table
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (createTableError) {
        // Try alternative method if the RPC method fails
        try {
          const { error: sqlError } = await supabase
            .from('_sql')
            .select()
            .execute(createTableSQL);

          if (sqlError) {
            throw new Error(`Failed to create contact_messages table: ${sqlError.message}`);
          }
        } catch (sqlExecError) {
          console.error('Error executing SQL:', sqlExecError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `Failed to create contact_messages table: ${sqlExecError.message}` })
          };
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Contact messages table created successfully' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Contact messages table already exists' })
    };
  } catch (error) {
    console.error('Error in setupContactMessages function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server error: ${error.message}` })
    };
  }
};
