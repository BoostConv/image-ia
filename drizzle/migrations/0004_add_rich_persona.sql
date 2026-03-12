-- Migration: Add Rich Persona columns
-- Description: Adds rich_profile and linked_angles columns to personas table for Couche 4
-- Date: 2026-03-12

-- Add rich_profile column to personas table
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS rich_profile JSONB;

-- Add linked_angles column to personas table
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS linked_angles JSONB;

-- Create GIN index for rich_profile JSON queries
CREATE INDEX IF NOT EXISTS idx_personas_rich_profile
ON personas USING GIN (rich_profile);

-- Create GIN index for linked_angles
CREATE INDEX IF NOT EXISTS idx_personas_linked_angles
ON personas USING GIN (linked_angles);

-- Comments
COMMENT ON COLUMN personas.rich_profile IS 'Rich persona with 5-level desires, defense psychology, language profile, situational triggers, and angle affinities';
COMMENT ON COLUMN personas.linked_angles IS 'Array of marketing angle IDs linked to this persona';
