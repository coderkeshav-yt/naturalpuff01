-- This migration adds a slug column to the products table with proper error handling
-- It's designed to be idempotent (can be run multiple times without errors)

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'slug'
  ) THEN
    ALTER TABLE products ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Create a function to generate slugs from product names if it doesn't exist
-- Drop it first to ensure we have the latest version
DROP FUNCTION IF EXISTS generate_slug(TEXT);
CREATE FUNCTION generate_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens, remove duplicate hyphens
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing products with generated slugs only if slug is NULL or empty
UPDATE products 
SET slug = generate_slug(name) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Check if the unique constraint exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_slug_key' AND conrelid = 'products'::regclass
  ) THEN
    -- Try to add the constraint, but handle potential errors
    BEGIN
      ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add unique constraint to slug column: %', SQLERRM;
    END;
  END IF;
END $$;

-- Drop and recreate the function for setting product slugs
DROP FUNCTION IF EXISTS set_product_slug() CASCADE;
CREATE FUNCTION set_product_slug() RETURNS TRIGGER AS $$
BEGIN
  -- If slug is not provided, generate one from the name
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
    
    -- If the generated slug already exists, append the product ID to make it unique
    IF EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug) THEN
      NEW.slug := NEW.slug || '-' || NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers with IF NOT EXISTS checks
DO $$ 
BEGIN
  -- Drop existing triggers first to avoid conflicts
  DROP TRIGGER IF EXISTS before_insert_product ON products;
  DROP TRIGGER IF EXISTS before_update_product ON products;
  
  -- Create new triggers
  CREATE TRIGGER before_insert_product
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_product_slug();
    
  CREATE TRIGGER before_update_product
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (NEW.name IS DISTINCT FROM OLD.name AND (NEW.slug IS NULL OR NEW.slug = OLD.slug))
    EXECUTE FUNCTION set_product_slug();
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating triggers: %', SQLERRM;
END $$;

-- Add comment to explain the slug column
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug for the product, auto-generated from name if not provided';
