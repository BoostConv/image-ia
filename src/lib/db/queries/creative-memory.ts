import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";
import { db } from "../index";
import { generatedImages, generations, reviews } from "../schema";

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
    `=== ⛔ CONTRAINTE ANTI-REPETITION (OBLIGATOIRE) ===`,
    `${memory.totalAds} ads generees recemment. TU NE DOIS PAS reproduire les memes patterns.`,
  ];

  // Show most overused patterns as HARD EXCLUSIONS
  const overusedJobs = getOverused(memory.ad_jobs, 3);
  const overusedLevers = getOverused(memory.marketing_levers, 3);
  const overusedStyles = getOverused(memory.visual_styles, 2);

  if (overusedJobs.length) {
    parts.push(`🚫 AD JOBS SURREPRESENTES (NE PAS reutiliser sauf si impose par le squelette): ${overusedJobs.join(", ")}`);
  }
  if (overusedLevers.length) {
    parts.push(`🚫 LEVIERS SURREPRESENTES (chercher des angles DIFFERENTS): ${overusedLevers.join(", ")}`);
  }
  if (overusedStyles.length) {
    parts.push(`🚫 STYLES VISUELS SURREPRESENTES (explorer d'autres styles): ${overusedStyles.join(", ")}`);
  }

  const formatFreqs = formatFrequencies(memory.format_families);
  if (formatFreqs) parts.push(`Formats recents: ${formatFreqs}`);

  const layoutFreqs = formatFrequencies(memory.layout_families);
  if (layoutFreqs) parts.push(`Layouts recents: ${layoutFreqs}`);

  // Show recent headlines as EXPLICIT exclusions
  if (memory.headlines.length > 0) {
    const recentHeadlines = memory.headlines.slice(0, 8);
    parts.push(`\n🚫 HEADLINES DEJA UTILISEES (NE JAMAIS reprendre ni reformuler):`);
    recentHeadlines.forEach(h => parts.push(`  - "${h}"`));
    parts.push(`→ Chaque headline doit etre 100% ORIGINALE. Pas de variation d'une headline existante.`);
  }

  parts.push(`\n→ REGLE: Si tu as le moindre doute qu'un concept ressemble a un precedent, CHANGE-LE RADICALEMENT. Explore des emotions, des scenes et des registres JAMAIS utilises.`);

  return parts.join("\n");
}

/**
 * Get items that appear more than `threshold` times (overused).
 */
function getOverused(map: Record<string, number>, threshold: number): string[] {
  return Object.entries(map)
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${key} (${count}x)`);
}

// ============================================================
// FEW-SHOT LEARNING — Approved/rejected examples from reviews
// ============================================================

export interface FewShotExample {
  verdict: "approved" | "rejected";
  headline: string;
  ad_job: string;
  marketing_lever: string;
  visual_style: string;
  layout_family: string;
  belief_shift?: string;
  customer_insight?: string;
  comment?: string;
}

/**
 * Get approved and rejected examples for a brand from reviews.
 * Returns up to `limit` examples (balanced between approved and rejected).
 */
export async function getApprovedRejectedExamples(
  brandId: string,
  limit: number = 10,
): Promise<FewShotExample[]> {
  try {
    const results = await db
      .select({
        creativeData: generatedImages.creativeData,
        verdict: reviews.verdict,
        comment: reviews.comment,
      })
      .from(reviews)
      .innerJoin(generatedImages, eq(reviews.imageId, generatedImages.id))
      .where(
        and(
          eq(generatedImages.brandId, brandId),
          inArray(reviews.verdict, ["approved", "rejected"]),
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limit * 2); // Fetch more, then balance

    // Balance: up to limit/2 approved + limit/2 rejected
    const half = Math.ceil(limit / 2);
    const approved: FewShotExample[] = [];
    const rejected: FewShotExample[] = [];

    for (const row of results) {
      const data = row.creativeData as Record<string, unknown> | null;
      if (!data) continue;

      const headline = (data.headline as string) || "";
      if (!headline) continue; // Skip examples without headline

      const example: FewShotExample = {
        verdict: row.verdict as "approved" | "rejected",
        headline,
        ad_job: (data.ad_job as string) || "unknown",
        marketing_lever: (data.marketing_lever as string) || "unknown",
        visual_style: (data.visual_style as string) || "unknown",
        layout_family: (data.layout_family as string) || "unknown",
        belief_shift: data.belief_shift as string | undefined,
        customer_insight: data.customer_insight as string | undefined,
        comment: row.comment || undefined,
      };

      if (row.verdict === "approved" && approved.length < half) {
        approved.push(example);
      } else if (row.verdict === "rejected" && rejected.length < half) {
        rejected.push(example);
      }

      if (approved.length >= half && rejected.length >= half) break;
    }

    return [...approved, ...rejected];
  } catch (err) {
    console.warn("[FewShot] Query failed, returning empty:", err);
    return [];
  }
}

/**
 * Format few-shot examples as a directive for the planner prompt.
 */
export function formatFewShotDirective(examples: FewShotExample[]): string {
  if (examples.length === 0) return "";

  const approved = examples.filter(e => e.verdict === "approved");
  const rejected = examples.filter(e => e.verdict === "rejected");

  const parts: string[] = ["=== APPRENTISSAGE — RETOURS CLIENTS ==="];

  if (approved.length > 0) {
    parts.push("\n✅ APPROUVÉS (reproduire ces patterns) :");
    approved.forEach((ex, i) => {
      parts.push(`${i + 1}. Headline: "${ex.headline}" | Job: ${ex.ad_job} | Lever: ${ex.marketing_lever} | Style: ${ex.visual_style} | Layout: ${ex.layout_family}`);
      if (ex.comment) parts.push(`   → Feedback client: "${ex.comment}"`);
    });
  }

  if (rejected.length > 0) {
    parts.push("\n❌ REJETÉS (éviter ces patterns) :");
    rejected.forEach((ex, i) => {
      parts.push(`${i + 1}. Headline: "${ex.headline}" | Job: ${ex.ad_job} | Lever: ${ex.marketing_lever} | Style: ${ex.visual_style} | Layout: ${ex.layout_family}`);
      if (ex.comment) parts.push(`   → Feedback client: "${ex.comment}"`);
    });
  }

  parts.push("\n→ Utilise ces retours pour calibrer tes propositions.");
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
