-- Simple migration to add slug column to products table
-- This version is simplified to avoid conflicts and errors

-- Step 1: Add the slug column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'slug'
  ) THEN
    ALTER TABLE products ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Step 2: Create a simple function to generate slugs
CREATE OR REPLACE FUNCTION generate_product_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing products with generated slugs
UPDATE products 
SET slug = generate_product_slug(name) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Step 4: Add an index on the slug column for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

-- Step 5: Create a comment to document the column
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug for the product, generated from name';
