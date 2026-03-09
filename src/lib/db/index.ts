import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let _db: BetterSQLite3Database<typeof schema> | null = null;

function initTables(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo_path TEXT,
      mission TEXT,
      vision TEXT,
      positioning TEXT,
      tone TEXT,
      "values" TEXT,
      target_market TEXT,
      color_palette TEXT,
      typography TEXT,
      moodboard_paths TEXT,
      style_guide_text TEXT,
      website_url TEXT,
      scraped_data TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      usp TEXT,
      benefits TEXT,
      objections TEXT,
      pricing TEXT,
      positioning TEXT,
      season TEXT,
      usage_context TEXT,
      image_paths TEXT,
      marketing_arguments TEXT,
      target_audience TEXT,
      competitive_advantage TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT,
      demographics TEXT,
      psychographics TEXT,
      visual_style TEXT,
      prompt_modifiers TEXT,
      is_global INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS brand_documents (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size_bytes INTEGER,
      extracted_text TEXT,
      summary TEXT,
      key_insights TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS inspiration_ads (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name TEXT,
      source TEXT,
      competitor_name TEXT,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      analysis TEXT,
      tags TEXT,
      rating INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS guidelines (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      examples TEXT,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      source TEXT DEFAULT 'manual',
      performance_score REAL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS ad_knowledge (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      insight TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      based_on_approved INTEGER DEFAULT 0,
      based_on_rejected INTEGER DEFAULT 0,
      related_prompt_elements TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      brand_id TEXT REFERENCES brands(id),
      product_id TEXT REFERENCES products(id),
      persona_id TEXT REFERENCES personas(id),
      mode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      prompt_layers TEXT,
      compiled_prompt TEXT NOT NULL,
      format TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL,
      resolution TEXT DEFAULT '1K',
      variation_count INTEGER DEFAULT 1,
      reference_image_path TEXT,
      creative_distance REAL,
      original_brief TEXT,
      extracted_constraints TEXT,
      estimated_cost REAL,
      actual_cost REAL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS generated_images (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
      brand_id TEXT REFERENCES brands(id),
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      file_size_bytes INTEGER,
      format TEXT,
      persona_id TEXT REFERENCES personas(id),
      tags TEXT,
      status TEXT DEFAULT 'pending',
      preference_score REAL,
      gallery_id TEXT,
      score_data TEXT,
      composed_file_path TEXT,
      creative_data TEXT,
      ranking_data TEXT,
      iteration_of TEXT,
      iteration_level INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS galleries (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id),
      name TEXT NOT NULL,
      description TEXT,
      share_token TEXT UNIQUE NOT NULL,
      branding_config TEXT,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
      gallery_id TEXT REFERENCES galleries(id),
      reviewer_type TEXT NOT NULL,
      verdict TEXT NOT NULL,
      comment TEXT,
      suggested_prompt_change TEXT,
      applied_to_generation_id TEXT REFERENCES generations(id),
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS preference_scores (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id),
      dimension TEXT NOT NULL,
      dimension_value TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      sample_count INTEGER DEFAULT 0,
      is_manual_override INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS prompt_history (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES generations(id),
      compiled_prompt TEXT NOT NULL,
      result_rating INTEGER,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS campaign_templates (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      product_id TEXT REFERENCES products(id),
      persona_id TEXT REFERENCES personas(id),
      format TEXT,
      aspect_ratio TEXT,
      brief TEXT,
      batch_count INTEGER DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);
}

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH || "./data/studio.db";
  const absolutePath = path.resolve(dbPath);

  // Ensure data directory exists
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(absolutePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  // Auto-create tables if they don't exist (needed for Vercel /tmp)
  initTables(sqlite);

  _db = drizzle(sqlite, { schema });
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const realDb = getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (realDb as any)[prop];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
