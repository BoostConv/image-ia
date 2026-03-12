-- Migration: Add Marketing Angles table
-- Description: Creates marketing_angles table for Couche 3 (EPIC Framework)
-- Date: 2026-03-12

-- Create marketing_angles table
CREATE TABLE IF NOT EXISTS marketing_angles (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  angles JSONB,
  prioritization JSONB,
  created_at TEXT NOT NULL DEFAULT NOW(),
  updated_at TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_angles_product_id
ON marketing_angles(product_id);

CREATE INDEX IF NOT EXISTS idx_marketing_angles_brand_id
ON marketing_angles(brand_id);

CREATE INDEX IF NOT EXISTS idx_marketing_angles_created_at
ON marketing_angles(created_at);

-- GIN index for JSON queries on angles
CREATE INDEX IF NOT EXISTS idx_marketing_angles_angles
ON marketing_angles USING GIN (angles);

-- Comment on table
COMMENT ON TABLE marketing_angles IS 'Marketing angles using EPIC framework (Emotional, Practical, Identity, Critical) with hooks, narratives, and visual direction';
