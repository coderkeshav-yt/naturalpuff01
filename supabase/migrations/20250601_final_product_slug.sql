-- FINAL PRODUCT SLUG MIGRATION
-- This is a complete, functional migration that will make product detail pages work with slugs
-- Run this in the Supabase SQL editor to fix product detail page functionality

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

-- Step 2: Create a function to generate slugs (replace if it exists)
DROP FUNCTION IF EXISTS generate_product_slug(TEXT);
CREATE FUNCTION generate_product_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens, trim hyphens from ends
  RETURN TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g')));
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update ALL existing products with generated slugs
-- This ensures every product has a slug for URL routing
UPDATE products 
SET slug = 
  CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      generate_product_slug(name) || '-' || id::text
    ELSE 
      'product-' || id::text
  END
WHERE slug IS NULL OR slug = '';

-- Step 4: Create an index for faster lookups (won't error if it exists)
DROP INDEX IF EXISTS idx_products_slug;
CREATE INDEX idx_products_slug ON products (slug);

-- Step 5: Add a trigger to automatically generate slugs for new products
CREATE OR REPLACE FUNCTION set_product_slug_trigger() RETURNS TRIGGER AS $$
BEGIN
  -- If slug is not provided, generate one from the name
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
      NEW.slug := generate_product_slug(NEW.name);
    ELSE
      NEW.slug := 'product';
    END IF;
    
    -- Append ID to ensure uniqueness
    NEW.slug := NEW.slug || '-' || NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS before_product_insert ON products;
DROP TRIGGER IF EXISTS before_product_update ON products;

-- Create triggers for insert and update
CREATE TRIGGER before_product_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_slug_trigger();

CREATE TRIGGER before_product_update
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '' OR (NEW.name IS DISTINCT FROM OLD.name AND NEW.slug = OLD.slug))
  EXECUTE FUNCTION set_product_slug_trigger();

-- Step 6: Verify slugs were created successfully
DO $$
DECLARE
  missing_slugs INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_slugs FROM products WHERE slug IS NULL OR slug = '';
  
  IF missing_slugs > 0 THEN
    RAISE NOTICE 'Warning: % products still have missing slugs', missing_slugs;
  ELSE
    RAISE NOTICE 'Success: All products have slugs';
  END IF;
END $$;
