
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // SQL to create the function that will create or replace the configure_coupon_rls_policies function
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION public.create_coupon_rls_function()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        CREATE OR REPLACE FUNCTION public.configure_coupon_rls_policies()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
          -- Enable RLS on coupons table if not already enabled
          ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
          DROP POLICY IF EXISTS "Users can view active coupons" ON public.coupons;
          
          -- Create policy for admin to manage all coupons
          CREATE POLICY "Admins can manage all coupons" 
          ON public.coupons 
          FOR ALL 
          USING (
              auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1' -- Admin user ID
          );
          
          -- Create policy for users to view active coupons
          CREATE POLICY "Users can view active coupons" 
          ON public.coupons 
          FOR SELECT 
          USING (
              is_active = true AND 
              (expires_at IS NULL OR expires_at > now())
          );
        END;
        $func$;
      END;
      $$;
    `;
    
    // Create the function to create the RLS function
    const { error: createFunctionError } = await supabaseClient.rpc('create_coupon_rls_function_setup', {
      sql_command: createFunctionSql
    });
    
    if (createFunctionError) {
      // If the function doesn't exist, create it directly
      const { error: sqlError } = await supabaseClient.from('_sql').select().execute(createFunctionSql);
      if (sqlError) {
        throw new Error(`Error setting up coupon RLS function: ${sqlError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Coupon RLS setup successful" 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error setting up coupon RLS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
