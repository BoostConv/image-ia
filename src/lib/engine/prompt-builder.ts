import type {
  ConceptSpec,
  AdDirectorSpec,
  CreativeBrief,
  ArtDirection,
  FilteredContext,
  BuiltPrompt,
  SelectedReference,
  ImageGenerationConfig,
  CopyAssets,
  AdPromptStructure,
  GateVerdict,
} from "./types";
import type { LayoutFamily } from "../db/schema";
import { smartTruncateHeadline } from "./headline-utils";
import { RUPTURE_STRUCTURE_DEFS, GRAPHIC_TENSION_DEFS } from "./taxonomy";
import type { RuptureStructure, GraphicTension } from "./taxonomy";

// ============================================================
// LAYER D: PROMPT BUILDER (v3.2 — AD-HARDENED)
//
// Programmatic construction of the final image generation prompt.
// No AI call — pure template engineering.
//
// THREE specialized builders by render_family:
//   - photo_led (≤900 chars): scene that PROVES the ad claim
//   - design_led (≤700 chars): graphic structure with product
//   - hybrid (≤800 chars): partial scene + graphic overlay
//
// ALL modes generate TEXT-FREE images. Text is ALWAYS added later
// by the Composer (Sharp + SVG) for pixel-perfect typography.
//
// STRICT PROMPT STRUCTURE (every builder follows this):
//   1. Ad job — what the visual must accomplish
//   2. Single visual proof — the ONE scene/device that proves it
//   3. Exact product constraint — packaging fidelity from reference
//   4. Composition constraint — framing, focal, grid
//   5. Minimal environment — only what the scene requires
//   6. Text overlay space — reserved safe zone
//   7. Avoid list — explicit negatives
//
// BANNED FILLER: "ultra-high quality", "8K", "professional studio
// lighting", "vibrant and modern", "premium", "elegant" — unless
// they describe a SPECIFIC scene element.
// ============================================================

const MAX_PHOTO_LENGTH = 900;
const MAX_DESIGN_LENGTH = 700;
const MAX_HYBRID_LENGTH = 800;

/**
 * Product-aware suffix: keeps product's real packaging/logo intact,
 * blocks everything else (floating text, fake logos, watermarks).
 */
const IMAGE_RULES_SUFFIX = " Preserve exact product packaging, label, and shape from reference. No floating text, no typography, no words, no letters, no fake logos outside the real product, no watermark.";

// ─── V3 ENTRY POINT ──────────────────────────────────────────

/**
 * Build prompt for one concept using v3 types.
 * Routes to specialized builder by render_family.
 */
export function buildPromptV3(
  concept: ConceptSpec,
  direction: AdDirectorSpec | null,
  context: FilteredContext,
  references: SelectedReference[],
  aspectRatio: string,
): BuiltPrompt {
  let promptForModel: string;
  let editPrompt: string;

  if (!direction) {
    // Fallback: no art direction — build from concept alone
    promptForModel = buildFallbackPrompt(concept, context, references);
    editPrompt = "";
  } else {
    switch (concept.render_family) {
      case "photo_led":
        promptForModel = buildPhotoLedPass1(concept, direction, context, references);
        editPrompt = buildPhotoLedPass2(concept, direction, context);
        break;

      case "design_led":
        promptForModel = buildDesignLedPass1(concept, direction, context, references);
        editPrompt = buildDesignLedPass2(concept, direction, context);
        break;

      case "hybrid":
        promptForModel = buildHybridPass1(concept, direction, context, references);
        editPrompt = buildHybridPass2(concept, direction, context);
        break;

      default:
        promptForModel = buildPhotoLedPass1(concept, direction, context, references);
        editPrompt = buildPhotoLedPass2(concept, direction, context);
    }
  }

  return {
    prompt_for_model: promptForModel,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

// ============================================================
// PHASE 5+ — AD-FOCUSED PROMPT BUILDER
// Creates prompts 100% oriented META ADS with:
// - AD MISSION (belief shift, purpose)
// - LAYOUT STRUCTURE (grid, reading order, safe zones)
// - VISUAL FOCUS (attention anchor, eye path)
// - SCENE (environment, lighting, mood)
// - REFERENCE STRATEGY (layout inspiration, brand style)
// ============================================================

const MAX_AD_FOCUSED_LENGTH = 1200; // Shorter = better for Gemini

export interface AdFocusedPromptInput {
  concept: ConceptSpec;
  direction: AdDirectorSpec;
  context: FilteredContext;
  references: SelectedReference[];
  aspectRatio: string;
  layoutInspiration?: Buffer;
  brandStyleImages?: Buffer[];
  layoutFamily: LayoutFamily;
  copyAssets?: CopyAssets;
  layoutAnalysis?: import("../db/schema").LayoutAnalysis;
  creativityLevel?: 1 | 2 | 3;
  promptMode?: "standard" | "lean";
}

/**
 * Build an AD-FOCUSED prompt (Phase 5+).
 * Structured in 5 clear blocks:
 *   1. STRATÉGIE — objective, target emotion, unique promise
 *   2. CONCEPT — the strong creative idea
 *   3. DIRECTION ARTISTIQUE — lighting, realism, materials
 *   4. COMPOSITION — format, placement, structure, product
 *   5. TEXTE — headline, subtitle, placement, typography rules
 */
export function buildAdFocusedPrompt(
  input: AdFocusedPromptInput
): BuiltPrompt {
  // ── LEAN MODE — minimal prompt for maximum Gemini creativity ──
  if (input.promptMode === "lean") {
    return buildLeanPrompt(input);
  }

  const { concept, direction, context, references, aspectRatio } = input;

  const rawHeadline = input.copyAssets?.headline || concept.headline;
  const brandName = input.copyAssets?.brandName || context.brand_name;
  const subtitle = input.copyAssets?.proof || concept.proof_text;

  // Enforce headline completeness — truncate at phrase boundary if too long
  const headline = enforceHeadlineCompleteness(rawHeadline);

  // ════════════════════════════════════════════════════════════
  // SYSTEM INSTRUCTION — identité permanente & règles (poids fort)
  // Gemini traite ça comme des contraintes non-négociables.
  // ════════════════════════════════════════════════════════════
  const sysLines: string[] = [];
  const cLevel = input.creativityLevel || 2;

  // ── MARQUE (identité + palette + ton — compact) ──
  const vc = context.brand_visual_code;
  const paletteparts: string[] = [];
  if (vc?.primary_color && vc.primary_color !== "Non défini") paletteparts.push(`${vc.primary_color} (dominant)`);
  if (vc?.secondary_color && vc.secondary_color !== "Non défini") paletteparts.push(`${vc.secondary_color} (secondaire)`);
  if (vc?.accent_color && vc.accent_color !== "Non défini") paletteparts.push(`${vc.accent_color} (accent)`);

  sysLines.push(`[MARQUE] ${brandName}${vc?.visual_tone ? ` — ${vc.visual_tone}` : ""}`);
  if (paletteparts.length > 0) sysLines.push(`Palette: ${paletteparts.join(", ")}`);
  // Also include the art-director's color direction if it adds palette detail
  const colorDirectionShort = direction.color_direction.split(".")[0];
  if (colorDirectionShort && !paletteparts.some(p => colorDirectionShort.includes(p))) {
    sysLines.push(`Direction couleur: ${colorDirectionShort}`);
  }
  if (vc?.font_style) sysLines.push(`Typo: ${vc.font_style}`);
  sysLines.push(`→ Le visuel DOIT être immédiatement reconnaissable comme appartenant à cette marque.`);
  if (cLevel === 3) {
    sysLines.push(`MODE EXPERIMENTAL: Compositions inhabituelles, angles surprenants, contrastes forts. Créer un visuel jamais vu dans cette catégorie.`);
  } else if (cLevel === 1) {
    sysLines.push(`MODE CLASSIQUE: Codes publicitaires éprouvés. Clarté, lisibilité, professionnalisme.`);
  }
  sysLines.push(``);

  // ── PRODUIT (fidélité packaging) ──
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (hasProductRef) {
    sysLines.push(`[PRODUIT — FIDELITE ABSOLUE]`);
    sysLines.push(`La photo de référence = source de vérité.`);
    sysLines.push(`Reproduire à l'IDENTIQUE : forme, proportions, couleurs, étiquette, logo.`);
    sysLines.push(`NE JAMAIS modifier, recolorer, simplifier ou inventer le packaging.`);
    sysLines.push(`Éclairage et ombres cohérents avec la scène.`);
    sysLines.push(``);
  }

  // ── TEXTE (seules les règles qui comptent pour Gemini) ──
  sysLines.push(`[TEXTE]`);
  sysLines.push(`Ne JAMAIS modifier, tronquer ou reformuler le texte demandé.`);
  sysLines.push(`Contraste fort texte/fond. Pas de texte hors zone définie.`);
  sysLines.push(``);

  // ── INTERDITS (only actual prohibitions — no permissions) ──
  sysLines.push(`[INTERDITS]`);
  // Brand-specific visual rules
  if (context.brand_rules_visual?.length) {
    for (const rule of context.brand_rules_visual) {
      sysLines.push(`- ${rule}`);
    }
  }
  // Art-director avoid list
  if (direction.avoid.length > 0) {
    for (const item of direction.avoid.slice(0, 4)) {
      sysLines.push(`- ${item}`);
    }
  }
  // Universal Gemini guardrails
  sysLines.push(`- Texte non demandé, mots inventés, badges, watermarks, lettres flottantes`);
  sysLines.push(`- Visuels surchargés (max 1 produit + 1 headline + 1 sous-texte)`);
  sysLines.push(`- Bullet points, listes, infographies complexes`);
  if (hasProductRef) sysLines.push(`- Packaging modifié, recoloré ou inventé`);
  sysLines.push(`- Visages/mains déformés, anatomie incorrecte`);
  sysLines.push(`- Éléments flottants sans ombre, composition plate`);

  // ── RAPPEL PRODUIT (fin = haute attention Gemini) ──
  if (hasProductRef) {
    sysLines.push(``);
    sysLines.push(`[RAPPEL] Le produit DOIT être IDENTIQUE à la photo de référence. AUCUNE modification.`);
  }

  const systemInstruction = sysLines.join("\n");

  // ════════════════════════════════════════════════════════════
  // USER PROMPT — brief créatif spécifique à cette ad
  // Gemini traite ça comme la direction créative à interpréter.
  // ════════════════════════════════════════════════════════════

  // ── Detect split/comparison layouts (need special handling) ──
  const isSplitLayout = ["split_screen", "avant_apres", "timeline_compare"].includes(
    concept.layout_family || ""
  );

  // ── 1. STRATÉGIE (compact — Gemini generates images, not strategy) ──
  const strategyLines: string[] = [];
  strategyLines.push(`[STRATÉGIE]`);
  strategyLines.push(`Émotion: ${context.emotional_angle}`);
  if (concept.belief_shift) {
    strategyLines.push(`Shift: ${concept.belief_shift}`);
  }

  // ── 2. CONCEPT ──
  const conceptLines: string[] = [];
  conceptLines.push(`[CONCEPT]`);
  conceptLines.push(concept.visual_device);
  if (concept.contrast_principle) {
    conceptLines.push(`Tension visuelle: ${concept.contrast_principle}`);
  }
  // Inject rupture structure ONLY if compatible with layout
  // Split layouts have their own structure — rupture_structure would conflict
  if (!isSplitLayout && concept.rupture_structure && RUPTURE_STRUCTURE_DEFS[concept.rupture_structure]) {
    conceptLines.push(`Dispositif visuel: ${RUPTURE_STRUCTURE_DEFS[concept.rupture_structure]}`);
  }
  // Inject graphic tension ONLY if compatible with layout
  // Split layouts don't have a "central subject" — radial_focus etc. would conflict
  if (!isSplitLayout && concept.graphic_tension && GRAPHIC_TENSION_DEFS[concept.graphic_tension]) {
    conceptLines.push(`Tension graphique: ${GRAPHIC_TENSION_DEFS[concept.graphic_tension]}`);
  }

  // ── 3. DIRECTION ARTISTIQUE ──
  const artLines: string[] = [];
  artLines.push(`[DIRECTION ARTISTIQUE]`);
  // For split layouts, describe dual lighting instead of generic studio
  if (isSplitLayout) {
    artLines.push(`Éclairage: Deux ambiances contrastées — côté "avant/problème" plus froid et terne, côté "après/solution" plus chaud et lumineux`);
  } else {
    artLines.push(`Éclairage: ${direction.lighting.split(".")[0]}`);
  }
  if (concept.visual_style) {
    artLines.push(`Style: ${concept.visual_style.replace(/_/g, " ")}`);
  }
  if (direction.texture_priority && direction.texture_priority !== "surface produit" && direction.texture_priority !== "product surface") {
    artLines.push(`Matières: ${direction.texture_priority}`);
  }
  if (direction.prop_list.length > 0) {
    artLines.push(`Props: ${direction.prop_list.slice(0, 3).join(", ")}`);
  }

  // ── 4. COMPOSITION ──
  const compositionLines: string[] = [];
  compositionLines.push(`[COMPOSITION]`);
  compositionLines.push(`Format: ${aspectRatio}`);
  // Inject layout analysis if available (Vision-analyzed structure)
  if (input.layoutAnalysis) {
    compositionLines.push(`Grille: ${input.layoutAnalysis.grid_structure}`);
    // Sanitize reading_order — remove color/size references from layout analysis
    // (they come from the inspiration image, not the brand)
    const readingOrder = input.layoutAnalysis.reading_order
      .replace(/\d+pt/g, "")          // remove font sizes
      .replace(/rouge saturé|red|#[0-9a-fA-F]{3,6}/gi, "couleur accent") // replace off-brand colors
      .replace(/\s+/g, " ")
      .trim();
    compositionLines.push(`Lecture: ${readingOrder}`);
    // Simplify hierarchy — keep structure, strip font sizes and colors
    const hierarchy = input.layoutAnalysis.visual_hierarchy
      .replace(/\(\d+pt.*?\)/g, "")   // remove (40pt, noir bold) etc.
      .replace(/rouge saturé|red|#[0-9a-fA-F]{3,6}/gi, "couleur accent")
      .replace(/\s+/g, " ")
      .trim();
    compositionLines.push(`Hiérarchie: ${hierarchy}`);
  } else if (direction.composition) {
    compositionLines.push(`Structure: ${direction.composition}`);
  }
  if (direction.framing) {
    compositionLines.push(`Cadrage: ${direction.framing}`);
  }
  if (direction.focal_point) {
    compositionLines.push(`Point focal: ${direction.focal_point}`);
  }
  // Camera — adapt to layout type
  if (direction.camera) {
    if (isSplitLayout) {
      // Split layouts need deep DOF (both sides sharp), not shallow
      const adaptedCamera = direction.camera
        .replace(/f\/[12]\.[0-9]/g, "f/8")               // shallow → deep DOF
        .replace(/shallow depth of field/gi, "deep focus"); // explicit fix
      compositionLines.push(`Caméra: ${adaptedCamera}`);
    } else {
      compositionLines.push(`Caméra: ${direction.camera}`);
    }
  }
  // Environment — skip if it duplicates the visual_device
  const envSimilarity = direction.environment && concept.visual_device
    ? direction.environment.slice(0, 40) === concept.visual_device.slice(0, 40)
    : false;
  if (!envSimilarity && direction.environment && direction.environment !== "fond sobre adapte au produit") {
    compositionLines.push(`Environnement: ${direction.environment}`);
  }

  // Product placement
  if (concept.product_role !== "absent") {
    compositionLines.push(`Produit: ${context.product_name} à ${direction.product_placement}`);
    if (direction.product_anchoring?.scale > 0) {
      compositionLines.push(`Taille produit: ~${Math.round(direction.product_anchoring.scale * 100)}% du cadre`);
    }
  }

  compositionLines.push(`Zone libre: ${direction.safe_zone.position} (~${direction.safe_zone.percentage}% du cadre) réservée pour le texte`);

  // ── 5. TEXTE ──
  const textLines: string[] = [];
  textLines.push(`[TEXTE]`);
  textLines.push(`Headline (grande taille, bold): "${headline}"`);
  if (subtitle) {
    textLines.push(`Sous-texte (taille moyenne): "${subtitle}"`);
  }
  if (brandName) {
    textLines.push(`Marque: "${brandName}"`);
  }
  textLines.push(`Placement: ${direction.safe_zone.position}`);

  // ── 6. CREATIVITY MODE (level 3 only) ──
  const creativityLines: string[] = [];
  if (cLevel === 3) {
    creativityLines.push(`[MODE EXPERIMENTAL]`);
    creativityLines.push(`Crée un visuel visuellement SURPRENANT et INHABITUEL pour cette catégorie.`);
    creativityLines.push(`Angles de caméra inattendus, contrastes chromatiques forts, compositions asymétriques.`);
    creativityLines.push(`Le visuel doit ARRÊTER le scroll par sa singularité visuelle.`);
  }

  // ── Assemble creative brief ──
  const allBlocks = [
    strategyLines.join("\n"),
    conceptLines.join("\n"),
    artLines.join("\n"),
    compositionLines.join("\n"),
    textLines.join("\n"),
    ...(creativityLines.length > 0 ? [creativityLines.join("\n")] : []),
  ];

  const promptText = allBlocks.join("\n\n");

  const editPrompt = buildAdFocusedPass2(concept, direction, context);

  return {
    prompt_for_model: promptText,
    system_instruction: systemInstruction,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

/** Alias for shared smart truncation utility */
const enforceHeadlineCompleteness = smartTruncateHeadline;

/**
 * Build pass 2 edit prompt for ad-focused generation.
 */
function buildAdFocusedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext
): string {
  const edits: string[] = [];

  // Sharpen product and improve integration
  if (concept.product_role === "hero" || direction.product_scale > 0.4) {
    edits.push(
      `Sharpen ${context.product_name}: crisp edges, accurate packaging texture. Ensure product has natural shadows and reflections matching the scene lighting — no visible cutout edges or halo artifacts.`
    );
  }

  // Ensure text is legible
  edits.push("Ensure all text in the image is perfectly legible, well-contrasted, and cleanly rendered.");

  // Color refinement
  if (direction.color_direction.length > 10) {
    edits.push(`Colors: ${direction.color_direction.slice(0, 80)}.`);
  }

  return edits.join(" ");
}

// ============================================================
// LEAN PROMPT MODE — Minimal prompt for maximum Gemini creativity
// Philosophy: describe the SCENE, the TEXT, and 3-4 hard constraints.
// Let Gemini make all creative decisions (lighting, camera, composition).
// ============================================================

function buildLeanPrompt(input: AdFocusedPromptInput): BuiltPrompt {
  const { concept, direction, context, references, aspectRatio } = input;

  const rawHeadline = input.copyAssets?.headline || concept.headline;
  const brandName = input.copyAssets?.brandName || context.brand_name;
  const subtitle = input.copyAssets?.proof || concept.proof_text;
  const headline = enforceHeadlineCompleteness(rawHeadline);

  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );

  const vc = context.brand_visual_code;

  // ── SYSTEM INSTRUCTION — ultra-compact ──
  const sysLines: string[] = [];
  sysLines.push(`[MARQUE] ${brandName}${vc?.visual_tone ? ` — ${vc.visual_tone}` : ""}`);

  const paletteparts: string[] = [];
  if (vc?.primary_color && vc.primary_color !== "Non défini") paletteparts.push(`${vc.primary_color} (dominant)`);
  if (vc?.secondary_color && vc.secondary_color !== "Non défini") paletteparts.push(vc.secondary_color);
  if (vc?.accent_color && vc.accent_color !== "Non défini") paletteparts.push(vc.accent_color);
  if (paletteparts.length > 0) sysLines.push(`Palette: ${paletteparts.join(", ")}${vc?.font_style ? ` | Typo: ${vc.font_style}` : ""}`);

  if (hasProductRef) {
    sysLines.push(`[PRODUIT] Reproduire le packaging IDENTIQUE à la photo de référence. AUCUNE modification.`);
  }

  // Only the REAL hard constraints — brand-specific visual rules
  const hardConstraints: string[] = [];
  if (context.brand_rules_visual?.length) {
    for (const rule of context.brand_rules_visual.slice(0, 4)) {
      hardConstraints.push(rule);
    }
  }
  hardConstraints.push("Pas de texte non demandé, badges, watermarks ou éléments décoratifs");
  if (hasProductRef) hardConstraints.push("Packaging non modifié — identique à la référence");
  sysLines.push(`[INTERDITS] ${hardConstraints.join(". ")}.`);

  const systemInstruction = sysLines.join("\n");

  // ── USER PROMPT — scene + text, that's it ──
  const promptLines: string[] = [];

  // Format
  const formatMap: Record<string, string> = {
    "1:1": "carrée", "4:5": "portrait 4:5", "9:16": "story verticale",
    "16:9": "paysage 16:9", "1.91:1": "bannière horizontale",
  };
  promptLines.push(`Pub ${formatMap[aspectRatio] || aspectRatio} pour ${brandName}.`);
  promptLines.push(``);

  // Scene — the visual_device IS the prompt
  promptLines.push(`SCENE : ${concept.visual_device}`);
  promptLines.push(``);

  // Text
  promptLines.push(`TEXTE : "${headline}" en ${direction.safe_zone?.position || concept.text_zone_spec || "haut"}, grande taille, bold.`);
  if (subtitle) {
    promptLines.push(`Sous-texte : "${subtitle}" en dessous, taille moyenne.`);
  }
  promptLines.push(`"${brandName}" visible.`);
  promptLines.push(``);

  // 2-3 essential constraints only
  const essentials: string[] = [];
  essentials.push(`Réserver ~${direction.safe_zone?.percentage || 20}% ${direction.safe_zone?.position || "en haut"} pour le texte`);
  if (concept.product_role !== "absent") {
    essentials.push(`${context.product_name} visible (~${Math.round((direction.product_anchoring?.scale || 0.35) * 100)}% du cadre)`);
  }
  // Only add color direction if it adds info beyond palette
  if (vc?.primary_color && vc.primary_color !== "Non défini") {
    essentials.push(`Fond clair, couleur dominante ${vc.primary_color}`);
  }
  promptLines.push(essentials.join(". ") + ".");

  const promptText = promptLines.join("\n");

  // Edit prompt — keep it simple too
  const editParts: string[] = [];
  if (hasProductRef) {
    editParts.push(`Sharpen ${context.product_name}: crisp edges, accurate packaging. Natural shadows matching scene lighting.`);
  }
  editParts.push("Ensure all text is perfectly legible and well-contrasted.");
  const editPrompt = editParts.join(" ");

  return {
    prompt_for_model: promptText,
    system_instruction: systemInstruction,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

/**
 * Format layout family for human-readable prompt.
 */
function formatLayoutFamily(family: LayoutFamily): string {
  const mapping: Record<LayoutFamily, string> = {
    // Éducatifs
    story_sequence: "Story Sequence layout (step-by-step narrative)",
    listicle: "Listicle layout (numbered list items)",
    annotation_callout: "Annotation/Callout layout (labeled details)",
    flowchart: "Flowchart layout (process flow)",
    // Centrés Image
    hero_image: "Hero Image layout (dominant visual)",
    product_focus: "Product Focus layout (product centered)",
    product_in_context: "Product in Context layout (lifestyle scene)",
    probleme_zoome: "Problème Zoomé layout (close-up on problem)",
    golden_hour: "Golden Hour layout (warm ambient lighting)",
    macro_detail: "Macro Detail layout (extreme close-up)",
    action_shot: "Action Shot layout (product in motion)",
    ingredient_showcase: "Ingredient Showcase layout (ingredients display)",
    scale_shot: "Scale Shot layout (size comparison)",
    destruction_shot: "Destruction Shot layout (dramatic impact)",
    texture_fill: "Texture Fill layout (full-frame texture)",
    negative_space: "Negative Space layout (minimal, breathing room)",
    // Social Proof
    testimonial_card: "Testimonial Card layout (quote + avatar)",
    ugc_style: "UGC Style layout (user-generated content feel)",
    press_as_seen_in: "Press/As Seen In layout (media logos)",
    wall_of_love: "Wall of Love layout (multiple testimonials)",
    statistique_data_point: "Statistique/Data Point layout (key metric)",
    tweet_post_screenshot: "Tweet/Post Screenshot layout (social post)",
    // Comparatifs
    split_screen: "Split Screen layout (50/50 comparison)",
    timeline_compare: "Timeline Compare layout (temporal progression)",
    avant_apres: "Avant/Après layout (before-after)",
    // Centrés Texte
    text_heavy: "Text Heavy layout (copy-dominant)",
    single_word: "Single Word layout (one impactful word)",
    fill_the_blank: "Fill the Blank layout (interactive prompt)",
    two_truths: "Two Truths layout (dual statement)",
    manifesto: "Manifesto layout (brand statement)",
    quote_card: "Quote Card layout (featured quote)",
  };
  return mapping[family] || family;
}

/**
 * Extract "from" part of belief shift.
 * Handles both French (DE...VERS) and English (FROM...TO) formats.
 */
function extractBeliefFrom(beliefShift: string): string {
  // Try French format: DE '...' → VERS
  const frenchMatch = beliefShift.match(/DE\s*['""]?(.+?)['""]?\s*→/i);
  if (frenchMatch) {
    return frenchMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Try English format: FROM '...' → TO
  const englishMatch = beliefShift.match(/FROM\s*['""]?(.+?)['""]?\s*→/i);
  if (englishMatch) {
    return englishMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Fallback: split by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) {
    return parts[0].replace(/^(DE|FROM)\s*/i, "").trim().replace(/^['""']|['""']$/g, "");
  }

  return "une croyance limitante";
}

/**
 * Extract "to" part of belief shift.
 * Handles both French (DE...VERS) and English (FROM...TO) formats.
 */
function extractBeliefTo(beliefShift: string): string {
  // Try French format: → VERS '...'
  const frenchMatch = beliefShift.match(/→\s*VERS\s*['""]?(.+?)['""]?\s*$/i);
  if (frenchMatch) {
    return frenchMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Try English format: → TO '...'
  const englishMatch = beliefShift.match(/→\s*TO\s*['""]?(.+?)['""]?\s*$/i);
  if (englishMatch) {
    return englishMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Fallback: split by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/^(VERS|TO)\s*/i, "").trim().replace(/^['""']|['""']$/g, "");
  }

  return beliefShift;
}

/**
 * Infer mood from concept and direction.
 */
function inferMood(concept: ConceptSpec, direction: AdDirectorSpec): string {
  // Use visual_style and style_mode to infer mood
  const styleMap: Record<string, string> = {
    minimal_product: "clean, focused, professional",
    editorial_lifestyle: "aspirational, warm, authentic",
    bold_graphic: "energetic, modern, impactful",
    luxe_restraint: "premium, sophisticated, refined",
    raw_authentic: "genuine, trustworthy, relatable",
    playful_pop: "fun, vibrant, engaging",
    tech_forward: "innovative, sleek, cutting-edge",
    organic_natural: "calm, natural, wholesome",
  };

  return styleMap[concept.visual_style] || direction.lighting.split(",")[0];
}

// ─── PHOTO-LED BUILDER (≤900 chars) ─────────────────────────
// Structure: ad job → visual proof → product → composition → environment → safe zone → avoid

function buildPhotoLedPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job — what this visual must accomplish (not a style declaration)
  parts.push(`Advertising photograph for ${concept.ad_job}.`);

  // 2. Single visual proof — the ONE scene that proves the ad claim
  parts.push(concept.visual_device + ".");

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(
        `Extract the product from the reference photo background. Integrate it naturally into the scene with matching lighting, shadows, and reflections. Same exact packaging, colors, label, shape. ${context.product_name} as ${concept.product_role} element at ${direction.product_placement}.`
      );
    } else {
      parts.push(
        `${context.product_name} as ${concept.product_role} element at ${direction.product_placement}.`
      );
    }
    // Product anchoring precision
    if (direction.product_anchoring.scale > 0) {
      parts.push(`Product occupies ~${Math.round(direction.product_anchoring.scale * 100)}% of frame.`);
    }
  }

  // 4. Composition constraint — framing, focal, camera
  parts.push(`${direction.composition}. ${direction.framing}. Focus: ${direction.focal_point}.`);
  parts.push(`${direction.camera}.`);

  // 5. Minimal environment — only what the scene needs
  parts.push(`${direction.environment}. ${direction.lighting.split(".")[0]}. ${direction.color_direction.split(".")[0]}.`);

  // Props only if they serve the proof (max 3)
  if (direction.prop_list.length > 0) {
    parts.push(`Props: ${direction.prop_list.slice(0, 3).join(", ")}.`);
  }

  // 6. Text overlay space — reserved zone
  parts.push(`Empty space at ${direction.safe_zone.position} (~${direction.safe_zone.percentage}% of frame) reserved for text overlay.`);

  // 7. Avoid list
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 4).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildPhotoLedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
): string {
  const edits: string[] = [];

  // Sharpen product if hero or large
  if (concept.product_role === "hero" || direction.product_anchoring.scale > 0.4) {
    edits.push(
      `Sharpen ${context.product_name}: crisp edges, accurate packaging texture.`
    );
  }

  // Enforce safe zone
  edits.push(
    `Ensure ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`
  );

  // Color refinement only if direction provides specifics
  if (direction.color_direction.length > 10) {
    edits.push(`Colors: ${direction.color_direction.slice(0, 80)}.`);
  }

  return edits.join(" ");
}

// ─── DESIGN-LED BUILDER (≤700 chars) ────────────────────────
// Structure: ad job → visual structure → product → contrast → safe zone → avoid

function buildDesignLedPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Graphic design ad layout for ${concept.ad_job}.`);

  // 2. Visual structure — background + geometry
  const gradientSpec = direction.render_family_specs?.gradient_spec;
  if (gradientSpec) {
    parts.push(`Background: ${gradientSpec}.`);
  } else {
    parts.push(`Background: ${concept.background_treatment} using ${direction.color_direction.split(".")[0]}.`);
  }
  const geometrySpec = direction.render_family_specs?.geometry_elements;
  if (geometrySpec) {
    parts.push(`${geometrySpec}.`);
  }

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(
        `Extract product from reference photo, remove its background. Place at ${direction.product_placement}, ~${Math.round(direction.product_anchoring.scale * 100)}% of frame. Same exact packaging, label, shape.`
      );
    } else {
      parts.push(`${context.product_name} at ${direction.product_placement}.`);
    }
    if (direction.product_anchoring.contact_shadow_required) {
      parts.push("Contact shadow beneath product.");
    }
  }

  // 4. Contrast / tension principle
  parts.push(`${concept.contrast_principle}.`);

  // 5. Text overlay space
  parts.push(`Empty space at ${direction.safe_zone.position} for text overlay.`);

  // 6. Avoid
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_DESIGN_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildDesignLedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  _context: FilteredContext,
): string {
  return [
    `Refine graphic composition: ${direction.composition.slice(0, 80)}.`,
    `Maintain ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`,
  ].join(" ");
}

// ─── HYBRID BUILDER (≤800 chars) ────────────────────────────
// Structure: ad job → scene + graphic elements → product → environment → safe zone → avoid

function buildHybridPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Mixed-media ad visual for ${concept.ad_job}.`);

  // 2. Visual proof — scene + graphic overlay
  const photoSpec = direction.render_family_specs?.photo_scene_spec;
  if (photoSpec) {
    parts.push(`Scene: ${photoSpec}.`);
  } else {
    parts.push(`${concept.visual_device}.`);
  }
  const geometrySpec = direction.render_family_specs?.geometry_elements;
  if (geometrySpec) {
    parts.push(`Graphic overlay: ${geometrySpec}.`);
  }
  const blendMode = direction.render_family_specs?.blend_mode;
  if (blendMode) {
    parts.push(`${blendMode}.`);
  }

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(`Extract product from reference photo, remove its background. Integrate naturally at ${direction.product_placement} with matching scene lighting and shadows.`);
    } else {
      parts.push(`${context.product_name} at ${direction.product_placement}.`);
    }
  }

  // 4. Minimal environment
  parts.push(`${direction.environment}. ${direction.lighting.split(".")[0]}.`);
  parts.push(`${direction.color_direction.split(".")[0]}.`);

  // 5. Text overlay space
  parts.push(`Empty space at ${direction.safe_zone.position} for text overlay.`);

  // 6. Avoid
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_HYBRID_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildHybridPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
): string {
  return [
    `Sharpen ${context.product_name}, crisp edges against graphic elements.`,
    `Ensure ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`,
  ].join(" ");
}

// ─── FALLBACK (no art direction available) ──────────────────

function buildFallbackPrompt(
  concept: ConceptSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Advertising visual for ${concept.ad_job}.`);

  // 2. Visual proof
  parts.push(concept.visual_device + ".");

  // 3. Product
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(`EXACT product from reference: same packaging, label, shape. ${context.product_name} as ${concept.product_role} element.`);
    } else {
      parts.push(`${context.product_name} as ${concept.product_role} element.`);
    }
  }

  // 4. Composition
  parts.push("Single focal point, clear visual hierarchy.");

  // 5. Safe zone
  parts.push(`Empty space at ${concept.text_zone_spec} for text overlay.`);

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

// ─── UTILITIES ──────────────────────────────────────────────

function condensePrompt(raw: string, maxLength: number): string {
  let prompt = raw.replace(/\s+/g, " ").trim();

  if (prompt.length <= maxLength) {
    return prompt;
  }

  const truncated = prompt.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > maxLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + "...";
}

function buildGenerationConfig(aspectRatio: string): ImageGenerationConfig {
  return {
    aspect_ratio: aspectRatio,
    quality: "high",
  };
}

// ─── V3 BATCH ──────────────────────────────────────────────

/**
 * Build prompts for a batch of concepts (v3).
 */
export function buildPromptBatchV3(
  concepts: ConceptSpec[],
  directions: (AdDirectorSpec | null)[],
  context: FilteredContext,
  referencesByIndex: SelectedReference[][],
  aspectRatio: string,
): BuiltPrompt[] {
  return concepts.map((concept, i) =>
    buildPromptV3(
      concept,
      directions[i],
      context,
      referencesByIndex[i] || [],
      aspectRatio,
    )
  );
}

// ─── V4 AD-FOCUSED BATCH (Phase 5+) ─────────────────────────

export interface AdFocusedBatchInput {
  concepts: ConceptSpec[];
  directions: AdDirectorSpec[];
  context: FilteredContext;
  referencesByIndex: SelectedReference[][];
  aspectRatio: string;
  layoutFamilies: LayoutFamily[];
  layoutInspirations?: (Buffer | undefined)[];
  brandStyleImages?: Buffer[];
  copyAssetsByIndex?: CopyAssets[];
  layoutAnalyses?: Map<string, import("../db/schema").LayoutAnalysis>;
  creativityLevel?: 1 | 2 | 3;
  promptMode?: "standard" | "lean";
}

/**
 * Build prompts for a batch of concepts (ad-focused v4).
 * Uses the new ad-focused prompt structure with layout inspirations.
 */
export function buildAdFocusedPromptBatch(
  input: AdFocusedBatchInput
): BuiltPrompt[] {
  const {
    concepts,
    directions,
    context,
    referencesByIndex,
    aspectRatio,
    layoutFamilies,
    layoutInspirations,
    brandStyleImages,
    copyAssetsByIndex,
  } = input;

  return concepts.map((concept, i) => {
    const direction = directions[i];
    const references = referencesByIndex[i] || [];
    const layoutFamily = layoutFamilies[i] || concept.layout_family;
    const layoutInspiration = layoutInspirations?.[i];
    const copyAssets = copyAssetsByIndex?.[i];

    // If we don't have direction, fallback to V3
    if (!direction) {
      return buildPromptV3(concept, null, context, references, aspectRatio);
    }

    return buildAdFocusedPrompt({
      concept,
      direction,
      context,
      references,
      aspectRatio,
      layoutFamily: layoutFamily as LayoutFamily,
      layoutInspiration,
      brandStyleImages,
      copyAssets,
      layoutAnalysis: input.layoutAnalyses?.get(layoutFamily),
      creativityLevel: input.creativityLevel,
      promptMode: input.promptMode,
    });
  });
}

// ─── FEEDBACK LOOP: PROMPT ADJUSTMENT AFTER GATE FAILURE ────
// P1 optimization: when render gate rejects an image, adjust the
// prompt based on the specific failure scores and retry once.

/**
 * Adjust a prompt after a render gate failure.
 * Reads the gate verdict scores and adds targeted negative constraints.
 */
export function adjustPromptAfterGateFailure(
  originalPrompt: BuiltPrompt,
  verdict: GateVerdict,
): BuiltPrompt {
  const scores = verdict.scores;
  const adjustments: string[] = [];

  // High "pasted" score → add compositing constraints
  if ((scores.product_looks_pasted ?? 0) > 7) {
    adjustments.push("Product must appear naturally integrated with coherent shadows and reflections. NOT composited, NOT pasted. Natural contact shadows and ambient occlusion.");
  } else if ((scores.product_looks_pasted ?? 0) > 5) {
    adjustments.push("Ensure natural shadows and reflections around product. Avoid any composited look.");
  }

  // High fidelity risk → add fidelity constraints
  if ((scores.product_fidelity_risk ?? 0) > 7) {
    adjustments.push("CRITICAL: Product packaging must be EXACT — same shape, proportions, label, colors. Do NOT distort or modify the product.");
  } else if ((scores.product_fidelity_risk ?? 0) > 5) {
    adjustments.push("Preserve exact product proportions, label placement, and packaging shape.");
  }

  // Low perspective coherence → simplify scene
  if ((scores.perspective_coherent ?? 10) < 3) {
    adjustments.push("SIMPLIFY the scene. Use a single consistent camera angle. All elements must share the same vanishing point and perspective. Avoid complex multi-plane compositions.");
  } else if ((scores.perspective_coherent ?? 10) < 5) {
    adjustments.push("Ensure consistent perspective across all scene elements. Single vanishing point.");
  }

  // Low safe zone usability → enlarge safe zone
  if ((scores.safe_zone_usable ?? 10) < 4) {
    adjustments.push("ENLARGE the empty space reserved for text overlay. At least 30% of the frame must be clean, uncluttered space suitable for headline placement. Push scene elements away from the text zone.");
  } else if ((scores.safe_zone_usable ?? 10) < 6) {
    adjustments.push("Ensure the text overlay zone is clearly empty — no products, props, or busy patterns in that area.");
  }

  if (adjustments.length === 0) {
    // Generic improvement if no specific score issue
    adjustments.push("Improve overall image quality. Ensure natural lighting, coherent perspective, and clear safe zones for text.");
  }

  const adjustmentSuffix = "\n\n=== RETRY CORRECTIONS ===\n" + adjustments.join("\n");

  return {
    ...originalPrompt,
    prompt_for_model: originalPrompt.prompt_for_model + adjustmentSuffix,
    edit_prompt_round_2: originalPrompt.edit_prompt_round_2,
  };
}

// ─── DETERMINISTIC DIRECTION BUILDER (replaces Art Director) ──
// Derives AdDirectorSpec from ConceptSpec + context programmatically.
// No AI call — pure template logic.

/**
 * Build an AdDirectorSpec deterministically from a ConceptSpec.
 * Replaces the Art Director (Layer C) Claude call.
 */
export function deriveDirectionFromConcept(
  concept: ConceptSpec,
  context: FilteredContext,
  hasProductImages: boolean,
): AdDirectorSpec {
  const productPlacement = deriveProductPlacement(concept.layout_family, concept.product_role);
  const productScale = deriveProductScale(concept.product_role);
  const safeZonePercentage = concept.product_role === "hero" ? 20 : 30;

  return {
    // Ad structure
    reading_order: `${concept.layout_family}: headline → product → CTA`,
    eye_path: "Z-pattern naturel",
    attention_anchor: concept.product_role === "hero" ? "Produit principal" : "Headline",
    grid_system: deriveGridSystem(concept.layout_family),

    // Ad modules
    headline_container_style: "bold, high contrast, clean sans-serif",
    proof_block_style: undefined,
    offer_module_position: undefined,
    cta_prominence: concept.ad_job === "convert_offer" ? "dominant" : "medium",
    brand_bar: undefined,

    // Product
    product_scale: productScale,
    product_placement: productPlacement,
    product_anchoring: {
      position: deriveProductPosition(concept.layout_family),
      scale: productScale,
      perspective_angle: 15,
      contact_shadow_required: true,
      occlusion_allowed: false,
      packaging_geometry_locked: hasProductImages,
    },

    // Visual direction — derived from concept + context
    composition: concept.visual_device,
    focal_point: concept.product_role === "hero" ? context.product_name : "Scene principale",
    camera: concept.render_family === "design_led" ? "N/A — design_led" : "85mm f/2.8, eye-level, shallow depth of field",
    framing: "Advertising framing, single focal point, clean composition",
    lighting: deriveLighting(concept.render_family),
    environment: extractEnvironmentFromVisualDevice(concept.visual_device),
    color_direction: `${context.brand_visual_code.primary_color} dominant, ${context.brand_visual_code.secondary_color} secondary, ${context.brand_visual_code.accent_color} accent`,
    texture_priority: "product surface",
    prop_list: [],

    // Zones
    safe_zone: {
      position: concept.text_zone_spec,
      percentage: safeZonePercentage,
    },
    overlay_map: {
      headline_zone: concept.text_zone_spec,
      cta_zone: "bottom-right",
      forbidden_zones: [],
      quiet_zones: [],
    },
    negative_space_shape: undefined,

    // Constraints
    text_density_budget: concept.text_density,
    character_budget_headline: Math.min(50, (concept.headline?.length || 20) + 10),
    must_keep: [context.product_name],
    avoid: ["texte non demandé", "composition plate", "éléments flottants sans ombre"],

    // Render family specific
    render_family_specs: deriveRenderFamilySpecs(concept),

    // Reference strategy
    reference_strategy: {
      use_product_ref: hasProductImages,
      product_ref_role: hasProductImages ? "exact_reproduction" : "style_guide",
      use_style_ref: false,
    },
  };
}

function deriveProductPlacement(layout: string, role: string): string {
  if (role === "absent") return "N/A";
  const placements: Record<string, string> = {
    // Éducatifs
    story_sequence: "featured in key story panel",
    listicle: "top or alongside list items",
    annotation_callout: "center with callout labels around it",
    flowchart: "at the end/result of the flow",
    // Centrés Image
    hero_image: "center, dominant, filling most of frame",
    product_focus: "center, prominent, clean background",
    product_in_context: "naturally placed in lifestyle scene",
    probleme_zoome: "close-up showing the problem area",
    golden_hour: "center, bathed in warm ambient light",
    macro_detail: "extreme close-up, filling frame",
    action_shot: "center, captured in motion",
    ingredient_showcase: "center, surrounded by raw ingredients",
    scale_shot: "side by side with comparison object",
    destruction_shot: "center, dramatic impact moment",
    texture_fill: "full frame texture/surface view",
    negative_space: "off-center with generous empty space",
    // Social Proof
    testimonial_card: "small, alongside testimonial text",
    ugc_style: "held or used by person, casual framing",
    press_as_seen_in: "center, above media logos",
    wall_of_love: "small, surrounded by review cards",
    statistique_data_point: "beside the key metric",
    tweet_post_screenshot: "within the social post frame",
    // Comparatifs
    split_screen: "right half, centered",
    timeline_compare: "right side (after state)",
    avant_apres: "right side (after state)",
    // Centrés Texte
    text_heavy: "small, bottom or corner",
    single_word: "below the impactful word",
    fill_the_blank: "beside the prompt text",
    two_truths: "bottom-center between statements",
    manifesto: "small, bottom corner",
    quote_card: "small, below the quote",
  };
  return placements[layout] || "center";
}

function deriveProductScale(role: string): number {
  switch (role) {
    case "hero": return 0.45;
    case "supporting": return 0.25;
    case "contextual": return 0.12;
    case "absent": return 0;
    default: return 0.35;
  }
}

function deriveProductPosition(layout: string): "center" | "left-third" | "right-third" | "bottom-center" | "top-center" {
  const positions: Record<string, "center" | "left-third" | "right-third" | "bottom-center" | "top-center"> = {
    // Éducatifs
    story_sequence: "center",
    listicle: "top-center",
    annotation_callout: "center",
    flowchart: "right-third",
    // Centrés Image
    hero_image: "center",
    product_focus: "center",
    product_in_context: "center",
    probleme_zoome: "center",
    golden_hour: "center",
    macro_detail: "center",
    action_shot: "center",
    ingredient_showcase: "center",
    scale_shot: "center",
    destruction_shot: "center",
    texture_fill: "center",
    negative_space: "left-third",
    // Social Proof
    testimonial_card: "bottom-center",
    ugc_style: "center",
    press_as_seen_in: "top-center",
    wall_of_love: "center",
    statistique_data_point: "right-third",
    tweet_post_screenshot: "center",
    // Comparatifs
    split_screen: "right-third",
    timeline_compare: "right-third",
    avant_apres: "right-third",
    // Centrés Texte
    text_heavy: "bottom-center",
    single_word: "bottom-center",
    fill_the_blank: "right-third",
    two_truths: "bottom-center",
    manifesto: "bottom-center",
    quote_card: "bottom-center",
  };
  return positions[layout] || "center";
}

function deriveGridSystem(layout: string): string {
  const grids: Record<string, string> = {
    // Éducatifs
    story_sequence: "3-4 panels séquentiels: narration visuelle étape par étape",
    listicle: "1 colonne: titre + items numérotés empilés verticalement",
    annotation_callout: "image centrale + callouts/labels pointant vers les détails",
    flowchart: "flux directionnel: étapes connectées par flèches/lignes",
    // Centrés Image
    hero_image: "1 zone: image dominante 70-80% + headline overlay",
    product_focus: "1 zone: produit centré sur fond clean + headline top/bottom",
    product_in_context: "scene lifestyle plein cadre, produit intégré naturellement",
    probleme_zoome: "gros plan problème + texte explicatif",
    golden_hour: "image ambiance plein cadre, texte overlay léger",
    macro_detail: "macro extrême plein cadre + copy latéral ou overlay",
    action_shot: "image dynamique plein cadre + headline overlay",
    ingredient_showcase: "produit centre + ingrédients disposés autour",
    scale_shot: "produit + objet de comparaison côte à côte",
    destruction_shot: "image impact dramatique plein cadre + headline",
    texture_fill: "texture/surface plein cadre + texte overlay",
    negative_space: "produit décalé + large espace vide pour texte",
    // Social Proof
    testimonial_card: "carte citation: avatar + quote + nom + produit",
    ugc_style: "format photo amateur: produit tenu/utilisé + caption",
    press_as_seen_in: "produit top + rangée de logos médias bottom",
    wall_of_love: "grille de mini-cards avis/témoignages",
    statistique_data_point: "chiffre clé géant + contexte texte",
    tweet_post_screenshot: "cadre post social (tweet/insta) + produit",
    // Comparatifs
    split_screen: "2 colonnes: left 50% | right 50%",
    timeline_compare: "progression temporelle: gauche (avant) → droite (après)",
    avant_apres: "2 zones: avant (gauche/top) | après (droite/bottom)",
    // Centrés Texte
    text_heavy: "texte dominant 60-70% + produit petit en support",
    single_word: "1 mot géant central + produit et contexte autour",
    fill_the_blank: "phrase à trous interactive + produit",
    two_truths: "2 affirmations empilées ou côte à côte + produit",
    manifesto: "bloc texte manifeste + branding minimal",
    quote_card: "citation encadrée centrée + attribution",
  };
  return grids[layout] || "composition libre, single focal point";
}

function deriveLighting(renderFamily: string): string {
  switch (renderFamily) {
    case "photo_led":
      return "Professional studio lighting, soft key light 45deg, fill light, natural shadows";
    case "design_led":
      return "Flat studio for packshot, even lighting";
    case "hybrid":
      return "Cinematic lighting, single key light with soft fill";
    default:
      return "Professional advertising lighting";
  }
}

function extractEnvironmentFromVisualDevice(visualDevice: string): string {
  // The visual_device already describes the scene — use it directly
  // Truncate to keep prompt concise
  if (visualDevice.length > 120) {
    return visualDevice.slice(0, 120).replace(/\s+\S*$/, "") + "...";
  }
  return visualDevice;
}

function deriveRenderFamilySpecs(concept: ConceptSpec): AdDirectorSpec["render_family_specs"] {
  switch (concept.render_family) {
    case "design_led":
      return {
        gradient_spec: `linear gradient using brand colors, ${concept.background_treatment} style`,
        geometry_elements: "clean geometric shapes, minimal decoration",
      };
    case "hybrid":
      return {
        photo_scene_spec: concept.visual_device,
        blend_mode: "photo background with graphic overlay elements",
      };
    case "photo_led":
    default:
      return {
        photo_scene_spec: concept.visual_device,
      };
  }
}

// ─── V2 COMPAT (for pipeline backward compat) ──────────────

/** @deprecated Use buildPromptV3 instead */
export function buildPrompt(
  brief: CreativeBrief,
  direction: ArtDirection | null,
  context: FilteredContext,
  references: SelectedReference[],
  aspectRatio: string,
  _completeAd?: { copyAssets: CopyAssets; brandName: string }
): BuiltPrompt {
  let promptForModel: string;
  let editPrompt: string;

  if (brief.renderMode === "product_first" && direction) {
    promptForModel = buildProductFirstPass1(brief, direction, context);
    editPrompt = buildProductFirstPass2(brief, direction);
  } else if (direction) {
    promptForModel = buildLegacyPass1(brief, direction, context);
    editPrompt = buildLegacyPass2(brief, direction, context);
  } else {
    promptForModel = buildLegacyScene(brief, context, references);
    editPrompt = "";
  }

  return {
    prompt_for_model: promptForModel,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

/** @deprecated Use buildPromptBatchV3 instead */
export function buildPromptBatch(
  briefs: CreativeBrief[],
  directions: (ArtDirection | null)[],
  context: FilteredContext,
  referencesByIndex: SelectedReference[][],
  aspectRatio: string,
  completeAdAssets?: Array<{ copyAssets: CopyAssets; brandName: string } | undefined>
): BuiltPrompt[] {
  return briefs.map((brief, i) =>
    buildPrompt(
      brief,
      directions[i],
      context,
      referencesByIndex[i] || [],
      aspectRatio,
      completeAdAssets?.[i]
    )
  );
}

// ─── LEGACY PROMPT BUILDERS (v2 compat) ─────────────────────

function buildLegacyScene(
  brief: CreativeBrief,
  context: FilteredContext,
  references: SelectedReference[]
): string {
  const parts: string[] = [];

  const styleMap: Record<string, string> = {
    photorealistic: "Ultra-high quality advertising photography, 8K, professional lighting.",
    stylized_photo: "Cinematic commercial photography, dramatic studio lighting, high contrast.",
    editorial: "High-end editorial photography, magazine quality, art-directed.",
    graphic_design: "Bold graphic design composition, clean geometric shapes, vibrant.",
    mixed_media: "Creative mixed media, photography blended with graphic elements.",
  };
  parts.push(styleMap[brief.realism_target] || styleMap.photorealistic);

  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (hasProductRef) {
    parts.push("Reproduce the EXACT product from the reference photo — same packaging, colors, logo, shape.");
  }

  parts.push(brief.single_visual_idea);
  parts.push(`${context.product_name} clearly visible, naturally integrated with real shadows.`);
  parts.push(`Clear empty space at ${brief.copy_safe_zone || "top"} for overlay.`);
  parts.push("Single focal point, clean composition.");

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildLegacyPass1(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(brief.single_visual_idea + ".");

  if (direction.product_role !== "absent") {
    parts.push(`${context.product_name} as ${direction.product_role} element. ${context.product_key_benefit}.`);
  }

  parts.push(direction.environment + ".");
  parts.push(`${direction.composition}. ${direction.framing}. Focus: ${direction.focal_point}.`);
  parts.push(`${direction.lighting}. ${direction.color_direction}.`);
  parts.push(direction.camera + ".");

  const styleShort: Record<string, string> = {
    photorealistic: "Ultra-realistic advertising photography, medium format quality.",
    stylized_photo: "Stylized commercial photography, dramatic lighting.",
    editorial: "Editorial magazine photography, art directed.",
    graphic_design: "Clean graphic design with photographic elements.",
    mixed_media: "Mixed media, photography with graphic elements.",
  };
  parts.push(styleShort[brief.realism_target] || styleShort.photorealistic);

  if (direction.prop_list.length > 0 && direction.prop_list.length <= 4) {
    parts.push(`Props: ${direction.prop_list.join(", ")}.`);
  }

  parts.push(`Leave clear space at ${direction.safe_zone.position} for text overlay.`);
  parts.push("No text, no logos, no watermarks in the image.");

  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH);
}

function buildLegacyPass2(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const edits: string[] = [];

  if (direction.product_role === "hero") {
    edits.push(
      `Sharpen ${context.product_name} details: crisp edges, accurate ${direction.texture_priority} texture.`
    );
  }

  edits.push(
    `Refine lighting (${direction.lighting.slice(0, 60)}) and colors (${direction.color_direction.slice(0, 60)}).`
  );

  edits.push(
    `Ensure ${direction.safe_zone.percentage}% clear space at ${direction.safe_zone.position}. No text in image.`
  );

  return edits.join(" ");
}

function buildProductFirstPass1(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(`Professional product photography: ${context.product_name}. ${brief.single_visual_idea}.`);
  parts.push(`Exact product reproduction from reference — accurate packaging, logo, colors, materials (${direction.texture_priority}).`);

  const anchoring = direction.product_anchoring;
  if (anchoring) {
    parts.push(
      `Product at ${anchoring.position}, ~${Math.round(anchoring.scale * 100)}% of frame.${anchoring.contact_shadow_required ? " Natural contact shadow." : ""}`
    );
  }

  parts.push(`${direction.environment}. ${direction.lighting}.`);
  parts.push(`${direction.camera}. Sharp focus on product, soft background.`);
  parts.push(`${direction.color_direction}.`);

  parts.push(`Clear space at ${direction.safe_zone.position} for text. No text in image.`);

  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH);
}

function buildProductFirstPass2(
  brief: CreativeBrief,
  direction: ArtDirection,
): string {
  return [
    `Extend scene around product: ${direction.environment}. Keep product unchanged.`,
    `Match perspective and lighting. ${direction.color_direction}.`,
    `Maintain clear space at ${direction.safe_zone.position}. No text.`,
  ].join(" ");
}
