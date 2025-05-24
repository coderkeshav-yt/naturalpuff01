import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey
    );

    // Check if contact_messages table exists
    const { error: tableCheckError } = await supabaseClient
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
      const { error: createTableError } = await supabaseClient.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (createTableError) {
        // Try alternative method if the RPC method fails
        const { error: sqlError } = await supabaseClient
          .from('_sql')
          .select()
          .execute(createTableSQL);

        if (sqlError) {
          throw new Error(`Failed to create contact_messages table: ${sqlError.message}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Contact messages table created successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contact messages table already exists' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
