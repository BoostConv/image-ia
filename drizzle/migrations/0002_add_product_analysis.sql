-- Migration: Add Product Analysis column
-- Description: Adds product_analysis JSONB column to products table for Couche 2
-- Date: 2026-03-12

-- Add product_analysis column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_analysis JSONB;

-- Create GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_products_analysis
ON products USING GIN (product_analysis);

-- Comment on column
COMMENT ON COLUMN products.product_analysis IS 'Comprehensive product analysis including FAB benefits, USP triptyque, DUR problems, value equation, objections, and sales arguments';
