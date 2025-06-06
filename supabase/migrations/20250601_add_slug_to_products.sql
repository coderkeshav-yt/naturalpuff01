-- Add slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a function to generate slugs from product names
CREATE OR REPLACE FUNCTION generate_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens, remove duplicate hyphens
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing products with generated slugs
UPDATE products 
SET slug = generate_slug(name) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Add unique constraint to slug column (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_slug_unique' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Create a trigger to auto-generate slugs for new products
CREATE OR REPLACE FUNCTION set_product_slug() RETURNS TRIGGER AS $$
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

-- Create the trigger before insert (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'before_insert_product' AND tgrelid = 'products'::regclass
  ) THEN
    CREATE TRIGGER before_insert_product
      BEFORE INSERT ON products
      FOR EACH ROW
      EXECUTE FUNCTION set_product_slug();
  END IF;
END $$;

-- Create the trigger before update (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'before_update_product' AND tgrelid = 'products'::regclass
  ) THEN
    CREATE TRIGGER before_update_product
      BEFORE UPDATE ON products
      FOR EACH ROW
      WHEN (NEW.name IS DISTINCT FROM OLD.name AND (NEW.slug IS NULL OR NEW.slug = OLD.slug))
      EXECUTE FUNCTION set_product_slug();
  END IF;
END $$;

-- Add comment to explain the slug column
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug for the product, auto-generated from name if not provided';
