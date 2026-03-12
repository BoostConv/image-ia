-- Migration: Add Brand Brief V1 columns
-- Description: Adds 5 new columns to brands table for AI-generated strategic brief
-- Date: 2026-03-12

-- A. Identite Fondamentale (vision, mission, combat, histoire, valeurs)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS identite_fondamentale JSONB;

-- B. Positionnement Strategique (proposition valeur, prix, element distinctif, avantages, tensions)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS positionnement_strategique JSONB;

-- G. Ton & Communication (ton dominant, registres, vocabulaire, red lines)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS ton_communication JSONB;

-- Metadata (gaps, sources, confidence, generated_at)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS brief_metadata JSONB;

-- Status (draft, complete, incomplete)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS brief_status TEXT DEFAULT 'draft';

-- Create index on brief_status for filtering brands with incomplete briefs
CREATE INDEX IF NOT EXISTS idx_brands_brief_status ON brands(brief_status);

-- Comment: Update existing brands to have 'draft' status
UPDATE brands SET brief_status = 'draft' WHERE brief_status IS NULL;
