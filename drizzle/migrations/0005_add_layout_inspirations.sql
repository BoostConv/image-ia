-- Migration: Add Layout Inspirations table + Brand Style Images
-- Description: Phase 5+ - System for uploading Meta Ads layout screenshots as visual references
-- Date: 2026-03-12

-- A. Create layout_inspirations table
CREATE TABLE IF NOT EXISTS layout_inspirations (
  id TEXT PRIMARY KEY,
  layout_family TEXT NOT NULL,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT,
  grid_system TEXT,
  reading_order TEXT,
  best_for JSONB,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by layout family
CREATE INDEX IF NOT EXISTS idx_layout_inspirations_family ON layout_inspirations(layout_family);

-- Index for brand-specific layouts
CREATE INDEX IF NOT EXISTS idx_layout_inspirations_brand ON layout_inspirations(brand_id);

-- B. Add brand_style_images column to brands table
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS brand_style_images JSONB;

-- Comment: brand_style_images stores paths to 3-5 visual reference images for brand style
