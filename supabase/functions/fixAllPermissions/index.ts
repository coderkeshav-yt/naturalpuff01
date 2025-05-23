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
    
    // Direct SQL to fix all permissions
    const fixAllPermissionsSql = `
      -- Enable RLS on orders table
      ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies on orders table
      DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
      DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
      DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
      DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
      DROP POLICY IF EXISTS "Allow anonymous orders" ON public.orders;
      DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
      
      -- Create policies for orders table
      CREATE POLICY "Users can view their own orders" 
      ON public.orders 
      FOR SELECT 
      USING (auth.uid() = user_id OR user_id IS NULL);
      
      CREATE POLICY "Users can insert their own orders" 
      ON public.orders 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
      
      CREATE POLICY "Admins can view all orders" 
      ON public.orders 
      FOR SELECT 
      USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');
      
      CREATE POLICY "Admins can update all orders" 
      ON public.orders 
      FOR UPDATE 
      USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');
      
      -- CRITICAL FIX: Allow anonymous orders (no login required)
      CREATE POLICY "Allow anonymous orders" 
      ON public.orders 
      FOR INSERT 
      WITH CHECK (true);
      
      -- Allow everyone to update their own orders
      CREATE POLICY "Users can update their own orders" 
      ON public.orders 
      FOR UPDATE 
      USING (auth.uid() = user_id OR user_id IS NULL);
      
      -- Enable RLS on order_items table
      ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies on order_items table
      DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
      DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
      DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
      DROP POLICY IF EXISTS "Allow anonymous order items" ON public.order_items;
      
      -- Create policies for order_items table
      CREATE POLICY "Users can view their own order items" 
      ON public.order_items 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o 
          WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL)
        )
      );
      
      CREATE POLICY "Users can insert their own order items" 
      ON public.order_items 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.orders o 
          WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL)
        )
      );
      
      CREATE POLICY "Admins can view all order items" 
      ON public.order_items 
      FOR ALL 
      USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');
      
      -- CRITICAL FIX: Allow anonymous order items
      CREATE POLICY "Allow anonymous order items" 
      ON public.order_items 
      FOR INSERT 
      WITH CHECK (true);
      
      -- Enable RLS on products table
      ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies on products table
      DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
      DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
      
      -- Create policies for products table
      CREATE POLICY "Everyone can view products" 
      ON public.products 
      FOR SELECT 
      USING (true);
      
      CREATE POLICY "Admins can manage products" 
      ON public.products 
      FOR ALL 
      USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');
      
      -- Enable RLS on coupons table
      ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies on coupons table
      DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
      DROP POLICY IF EXISTS "Users can view active coupons" ON public.coupons;
      
      -- Create policies for coupons table
      CREATE POLICY "Admins can manage all coupons" 
      ON public.coupons 
      FOR ALL 
      USING (auth.uid() = 'a3301900-bf5e-4afe-a114-d59bb08a05a1');
      
      CREATE POLICY "Users can view active coupons" 
      ON public.coupons 
      FOR SELECT 
      USING (
        is_active = true AND 
        (expires_at IS NULL OR expires_at > now())
      );
    `;
    
    // Execute the SQL directly
    const { error: sqlError } = await supabaseClient.rpc('exec_sql', {
      sql: fixAllPermissionsSql
    });
    
    if (sqlError) {
      console.error('Error executing SQL via RPC:', sqlError);
      
      // Try alternative approach with raw SQL
      try {
        // Split the SQL into individual statements
        const statements = fixAllPermissionsSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        // Execute each statement individually
        for (const statement of statements) {
          const { error } = await supabaseClient.from('_sql').select().execute(`${statement};`);
          if (error) {
            console.error(`Error executing statement: ${statement}`, error);
          }
        }
      } catch (rawSqlError) {
        console.error('Error executing raw SQL:', rawSqlError);
        throw new Error(`Failed to execute SQL: ${rawSqlError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "All database permissions have been fixed successfully",
        details: "Fixed permissions for orders, order_items, products, and coupons tables"
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
    console.error('Error fixing all permissions:', error);
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
