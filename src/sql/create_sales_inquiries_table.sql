-- Function to create the sales_inquiries table if it doesn't exist
CREATE OR REPLACE FUNCTION create_sales_inquiries_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the table already exists
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'sales_inquiries'
  ) INTO table_exists;
  
  -- Log the check result
  RAISE NOTICE 'Table exists check: %', table_exists;
  
  IF NOT table_exists THEN
    -- Create the sales_inquiries table
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TABLE public.sales_inquiries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      location TEXT,
      order_size TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      responded BOOLEAN DEFAULT false,
      notes TEXT,
      responded_at TIMESTAMP WITH TIME ZONE
    );
    
    RAISE NOTICE 'Created sales_inquiries table';

    -- Add RLS policies
    ALTER TABLE public.sales_inquiries ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS';

    -- Allow anonymous users to insert
    CREATE POLICY "Allow anonymous insert" ON public.sales_inquiries
      FOR INSERT
      TO anon
      WITH CHECK (true);
    RAISE NOTICE 'Created anon insert policy';

    -- Allow authenticated users to select
    CREATE POLICY "Allow authenticated select" ON public.sales_inquiries
      FOR SELECT
      TO authenticated
      USING (true);
    RAISE NOTICE 'Created authenticated select policy';

    -- Allow authenticated users to update
    CREATE POLICY "Allow authenticated update" ON public.sales_inquiries
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
    RAISE NOTICE 'Created authenticated update policy';

    -- Allow authenticated users to delete
    CREATE POLICY "Allow authenticated delete" ON public.sales_inquiries
      FOR DELETE
      TO authenticated
      USING (true);
    RAISE NOTICE 'Created authenticated delete policy';
  ELSE
    RAISE NOTICE 'Table sales_inquiries already exists, skipping creation';
  END IF;
  
  -- Make sure permissions are granted even if table already exists
  GRANT ALL ON public.sales_inquiries TO authenticated;
  GRANT INSERT ON public.sales_inquiries TO anon;
  RAISE NOTICE 'Granted table permissions';
  
  RETURN;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION create_sales_inquiries_table() TO anon, authenticated;

-- Comment to explain usage
COMMENT ON FUNCTION create_sales_inquiries_table() IS 'Creates the sales_inquiries table with proper permissions if it does not exist';

