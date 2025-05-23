-- Create carousel items table
CREATE TABLE carousel_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  product_link TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" 
  ON carousel_items 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users with admin role to manage carousel items
CREATE POLICY "Allow admins to manage carousel items" 
  ON carousel_items 
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'
    )
  );
