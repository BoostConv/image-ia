import { eq, and, gte, desc, sql } from "drizzle-orm";
import { db } from "../index";
import { generatedImages, generations } from "../schema";

// ============================================================
// CREATIVE MEMORY — Inter-batch diversification
// Queries recent creative patterns for a brand to avoid
// repeating the same combinations across batches.
// ============================================================

export interface CreativeMemory {
  format_families: Record<string, number>;
  layout_families: Record<string, number>;
  ad_jobs: Record<string, number>;
  marketing_levers: Record<string, number>;
  visual_styles: Record<string, number>;
  proof_mechanisms: Record<string, number>;
  rupture_structures: Record<string, number>;
  headlines: string[];
  totalAds: number;
}

/**
 * Get recent creative patterns for a brand.
 * Looks back `lookbackDays` days and counts frequency of each
 * taxonomy dimension used.
 */
export async function getRecentCreativePatterns(
  brandId: string,
  lookbackDays: number = 14,
  limit: number = 30,
): Promise<CreativeMemory> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  const cutoffStr = cutoffDate.toISOString();

  try {
    const results = await db
      .select({
        creativeData: generatedImages.creativeData,
      })
      .from(generatedImages)
      .innerJoin(generations, eq(generatedImages.generationId, generations.id))
      .where(
        and(
          eq(generatedImages.brandId, brandId),
          gte(generatedImages.createdAt, cutoffStr),
          eq(generatedImages.status, "completed"),
        )
      )
      .orderBy(desc(generatedImages.createdAt))
      .limit(limit);

    const memory: CreativeMemory = {
      format_families: {},
      layout_families: {},
      ad_jobs: {},
      marketing_levers: {},
      visual_styles: {},
      proof_mechanisms: {},
      rupture_structures: {},
      headlines: [],
      totalAds: results.length,
    };

    for (const row of results) {
      const data = row.creativeData as Record<string, unknown> | null;
      if (!data) continue;

      increment(memory.format_families, data.format_family as string);
      increment(memory.layout_families, data.layout_family as string);
      increment(memory.ad_jobs, data.ad_job as string);
      increment(memory.marketing_levers, data.marketing_lever as string);
      increment(memory.visual_styles, data.visual_style as string);
      increment(memory.proof_mechanisms, data.proof_mechanism as string);
      increment(memory.rupture_structures, data.rupture_structure as string);

      // Extract headline from brief if available
      const brief = data.brief as Record<string, unknown> | undefined;
      if (brief?.headline) {
        memory.headlines.push(brief.headline as string);
      }
    }

    return memory;
  } catch (err) {
    console.warn("[CreativeMemory] Query failed, returning empty memory:", err);
    return {
      format_families: {},
      layout_families: {},
      ad_jobs: {},
      marketing_levers: {},
      visual_styles: {},
      proof_mechanisms: {},
      rupture_structures: {},
      headlines: [],
      totalAds: 0,
    };
  }
}

/**
 * Format creative memory as a directive for the planner prompt.
 */
export function formatCreativeMemoryDirective(memory: CreativeMemory): string {
  if (memory.totalAds === 0) return "";

  const parts: string[] = [
    `=== DEJA UTILISE (DIVERSIFIER!) ===`,
    `${memory.totalAds} ads generees recemment pour cette marque.`,
  ];

  const formatFreqs = formatFrequencies(memory.format_families);
  if (formatFreqs) parts.push(`Formats recents: ${formatFreqs}`);

  const layoutFreqs = formatFrequencies(memory.layout_families);
  if (layoutFreqs) parts.push(`Layouts recents: ${layoutFreqs}`);

  const styleFreqs = formatFrequencies(memory.visual_styles);
  if (styleFreqs) parts.push(`Styles recents: ${styleFreqs}`);

  const jobFreqs = formatFrequencies(memory.ad_jobs);
  if (jobFreqs) parts.push(`Ad Jobs recents: ${jobFreqs}`);

  const leverFreqs = formatFrequencies(memory.marketing_levers);
  if (leverFreqs) parts.push(`Leviers recents: ${leverFreqs}`);

  parts.push("→ EVITER ces combinaisons. Privilegier les patterns/layouts/styles NON utilises.");

  return parts.join("\n");
}

// ─── HELPERS ─────────────────────────────────────────────────

function increment(map: Record<string, number>, key: string | undefined | null) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

function formatFrequencies(map: Record<string, number>): string {
  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (entries.length === 0) return "";

  return entries.map(([key, count]) => `${key} (${count}x)`).join(", ");
}
