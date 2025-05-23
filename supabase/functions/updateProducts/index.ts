
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exposed by default
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current timestamp
    const now = new Date().toISOString();

    // Log the start of the update process
    console.log('Starting product data update process');

    // Check if the marketing_offers table exists, create it if it doesn't
    try {
      const { error: tableCheckError } = await supabaseClient
        .from('marketing_offers')
        .select('id', { count: 'exact', head: true });

      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('Creating marketing_offers table');
        
        // Table doesn't exist, create it
        const { error: createTableError } = await supabaseClient.rpc('create_marketing_offers_table');
        
        if (createTableError) {
          console.error('Error creating marketing_offers table:', createTableError);
          // Continue anyway, the function might still work for products
        } else {
          console.log('Successfully created marketing_offers table');
        }
      }
    } catch (error) {
      console.error('Error checking/creating marketing_offers table:', error);
      // Continue anyway, the function might still work for products
    }

    // Fetch products from the database
    console.log('Fetching products from database');
    const { data: products, error: fetchError } = await supabaseClient
      .from('products')
      .select('*');

    if (fetchError) {
      throw new Error(`Error fetching products: ${fetchError.message}`);
    }

    // Log the number of products found
    console.log(`Found ${products?.length || 0} products`);

    // Process products - extract variant information from details field
    for (const product of products || []) {
      try {
        // Parse details field if it exists
        if (product.details) {
          const details = JSON.parse(product.details);
          
          // If there's a category in details, ensure it's in the details field
          if (!details.category && product.category) {
            details.category = product.category;
            console.log(`Updated category for product ${product.id}`);
          }
          
          // Update the product with processed details
          const { error: updateError } = await supabaseClient
            .from('products')
            .update({ 
              details: JSON.stringify(details),
              updated_at: now
            })
            .eq('id', product.id);
            
          if (updateError) {
            console.error(`Error updating product ${product.id}:`, updateError);
          } else {
            console.log(`Successfully updated product ${product.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
      }
    }

    // Return the updated products
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Products updated successfully',
        updated: products?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
