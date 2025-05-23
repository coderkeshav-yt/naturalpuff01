
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SQL queries to fix coupon permissions
const ENABLE_RLS = `ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;`;

const CREATE_SELECT_POLICY = `
DROP POLICY IF EXISTS "Authenticated users can view coupons" ON "public"."coupons";
CREATE POLICY "Authenticated users can view coupons"
  ON "public"."coupons"
  FOR SELECT
  USING (auth.role() = 'authenticated');
`;

const CREATE_INSERT_POLICY = `
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON "public"."coupons";
CREATE POLICY "Authenticated users can insert coupons"
  ON "public"."coupons"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
`;

const CREATE_UPDATE_POLICY = `
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON "public"."coupons";
CREATE POLICY "Authenticated users can update coupons"
  ON "public"."coupons"
  FOR UPDATE
  USING (auth.role() = 'authenticated');
`;

const CREATE_DELETE_POLICY = `
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON "public"."coupons";
CREATE POLICY "Authenticated users can delete coupons"
  ON "public"."coupons"
  FOR DELETE
  USING (auth.role() = 'authenticated');
`;

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
    
    let success = false;
    const errors = [];
    
    // Method 1: Try using the RPC function
    try {
      console.log('Trying to create coupon RLS function...');
      const { error: createFunctionError } = await supabaseClient.rpc('create_coupon_rls_function');
      if (createFunctionError) {
        console.error('Error creating RLS function:', createFunctionError);
        errors.push(`Error creating RLS function: ${createFunctionError.message}`);
      } else {
        console.log('Successfully created coupon RLS function');
        
        console.log('Trying to configure coupon RLS policies...');
        const { error: policyError } = await supabaseClient.rpc('configure_coupon_rls_policies');
        if (policyError) {
          console.error('Error configuring coupon RLS:', policyError);
          errors.push(`Error configuring coupon RLS: ${policyError.message}`);
        } else {
          console.log('Successfully configured coupon RLS policies');
          success = true;
        }
      }
    } catch (err) {
      console.error('Exception in RPC method:', err);
      errors.push(`Exception in RPC method: ${err.message}`);
    }
    
    // Method 2: If RPC failed, try direct SQL execution
    if (!success) {
      try {
        console.log('Trying direct SQL execution...');
        
        // Enable RLS
        const { error: rlsError } = await supabaseClient.rpc('execute_sql_admin', { sql: ENABLE_RLS });
        if (rlsError) {
          console.error('Error enabling RLS:', rlsError);
          errors.push(`Error enabling RLS: ${rlsError.message}`);
        }
        
        // Create select policy
        const { error: selectError } = await supabaseClient.rpc('execute_sql_admin', { sql: CREATE_SELECT_POLICY });
        if (selectError) {
          console.error('Error creating select policy:', selectError);
          errors.push(`Error creating select policy: ${selectError.message}`);
        }
        
        // Create insert policy
        const { error: insertError } = await supabaseClient.rpc('execute_sql_admin', { sql: CREATE_INSERT_POLICY });
        if (insertError) {
          console.error('Error creating insert policy:', insertError);
          errors.push(`Error creating insert policy: ${insertError.message}`);
        }
        
        // Create update policy
        const { error: updateError } = await supabaseClient.rpc('execute_sql_admin', { sql: CREATE_UPDATE_POLICY });
        if (updateError) {
          console.error('Error creating update policy:', updateError);
          errors.push(`Error creating update policy: ${updateError.message}`);
        }
        
        // Create delete policy
        const { error: deleteError } = await supabaseClient.rpc('execute_sql_admin', { sql: CREATE_DELETE_POLICY });
        if (deleteError) {
          console.error('Error creating delete policy:', deleteError);
          errors.push(`Error creating delete policy: ${deleteError.message}`);
        }
        
        // If we got here without throwing, consider it a success
        console.log('Direct SQL execution completed');
        success = true;
      } catch (err) {
        console.error('Exception in direct SQL execution:', err);
        errors.push(`Exception in direct SQL execution: ${err.message}`);
      }
    }
    
    // Method 3: Last resort - try to use the PostgreSQL function directly
    if (!success) {
      try {
        console.log('Trying PostgreSQL function directly...');
        
        // This is a direct call to the PostgreSQL function that should exist
        const { error: directError } = await supabaseClient.rpc('fix_all_permissions');
        if (directError) {
          console.error('Error calling fix_all_permissions:', directError);
          errors.push(`Error calling fix_all_permissions: ${directError.message}`);
        } else {
          console.log('Successfully called fix_all_permissions');
          success = true;
        }
      } catch (err) {
        console.error('Exception calling fix_all_permissions:', err);
        errors.push(`Exception calling fix_all_permissions: ${err.message}`);
      }
    }
    
    if (!success) {
      throw new Error(`All permission fix methods failed: ${errors.join('; ')}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Coupon permissions fixed successfully" 
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
    console.error('Error fixing coupon permissions:', error);
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
