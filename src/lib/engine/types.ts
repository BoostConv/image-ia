// ============================================================
// ENGINE TYPES — Pipeline v3
// A: ContextFilter → J: BatchLocker → B: ConceptPlanner →
// B2: CreativeCritic → C: AdDirector → D: PromptBuilder →
// E: Renderer → H1: RenderGate → G: AdComposer →
// H2: CompositionGate → K: DualEvaluator → F: Ranking
// ============================================================

import type {
  AdJob,
  FormatFamily,
  LayoutFamily,
  ProofMechanism,
  RuptureStructure,
  GraphicTension,
  RenderFamily,
  HumanPresence,
  VisualStyle,
  StyleMode,
  AwarenessStage,
  MarketingLever,
} from "./taxonomy";

// ─── RAW INPUT (from DB) ────────────────────────────────────

import type {
  ProductAnalysis,
  RichPersona,
  MarketingAngleSpec,
  IdentiteFondamentale,
  PositionnementStrategique,
  TonCommunication,
} from "../db/schema";

export interface RawPipelineInput {
  brand: {
    name: string;
    description?: string;
    mission?: string;
    vision?: string;
    positioning?: string;
    tone?: string;
    values?: string[];
    targetMarket?: string;
    colorPalette?: { primary: string; secondary: string; accent: string; neutrals?: string[] };
    typography?: { headingFont: string; bodyFont: string; accentFont?: string };
    // V1 Brief fields
    identiteFondamentale?: IdentiteFondamentale;
    positionnementStrategique?: PositionnementStrategique;
    tonCommunication?: TonCommunication;
  };
  product?: {
    name: string;
    category?: string;
    usp?: string;
    benefits?: string[];
    positioning?: string;
    marketingArguments?: {
      headlines?: string[];
      hooks?: string[];
      callToActions?: string[];
      emotionalTriggers?: string[];
      socialProof?: string[];
      guarantees?: string[];
    };
    targetAudience?: string;
    competitiveAdvantage?: string;
    imagePaths?: string[];
    // COUCHE 2 — Product Analysis
    analysis?: ProductAnalysis;
  };
  persona?: {
    name: string;
    description?: string;
    demographics?: {
      ageRange?: string;
      gender?: string;
      location?: string;
      income?: string;
      lifestyle?: string;
    };
    psychographics?: {
      painPoints?: string[];
      motivations?: string[];
      aesthetic?: string;
    };
    visualStyle?: {
      colorTone?: string;
      photographyStyle?: string;
      lightingPreference?: string;
      compositionNotes?: string;
      modelType?: string;
      decorStyle?: string;
    };
    // COUCHE 4 — Rich Persona
    richProfile?: RichPersona;
  };
  // COUCHE 3 — Marketing Angle (selected for this generation)
  marketingAngle?: MarketingAngleSpec;
  brief?: string;
  format: string;
  aspectRatio: string;
  count: number;
  guidelinesPrompt?: string;
  documentsPrompt?: string;
  inspirationPrompt?: string;
  /** "clean" = no-text image + SVG overlay, "complete_ad" = full ad with text generated natively */
  renderStrategy?: "clean" | "complete_ad";
  /** Additional reference images uploaded by user (already decoded to Buffer) */
  additionalReferenceImages?: Buffer[];
  /** Brand style reference images (Phase 5+) — paths to pre-uploaded brand style visuals */
  brandStyleImagePaths?: string[];
}

// ─── A: FILTERED CONTEXT ────────────────────────────────────

export interface FilteredContext {
  audience_tension: string;
  promise: string;
  proof: string;
  emotional_angle: string;
  awareness_level: "unaware" | "problem_aware" | "solution_aware" | "product_aware" | "most_aware";
  brand_visual_code: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_style: string;
    visual_tone: string;
  };
  format_goal: string;
  constraints: string[];
  brief_summary?: string;
  product_name: string;
  product_key_benefit: string;
  brand_name: string;
  // V1 Brief additions
  red_lines?: string[];  // Hard constraints: things the brand must NEVER say/show
  brand_combat?: string;  // What the brand fights against (ennemi)
  brand_values?: Array<{ name: string; signification: string }>;

  // COUCHE 2 — Product Analysis
  product_fab_benefits?: string;      // Top FAB benefits formatted
  product_usp_triptyque?: string;     // USP/UMP/UMS formatted
  product_objections?: string;        // Key objections and responses
  product_value_equation?: string;    // Value equation summary

  // COUCHE 3 — Marketing Angle
  angle_epic_type?: string;           // emotional/practical/identity/critical
  angle_core_benefit?: string;        // The core benefit of the selected angle
  angle_hooks?: string[];             // Pre-written hooks from the angle
  angle_narrative?: string;           // Selected narrative structure
  angle_terrain?: string;             // Awareness + temperature summary

  // COUCHE 4 — Rich Persona
  persona_desires?: string;           // 5-level desires formatted
  persona_triggers?: string;          // Situational triggers
  persona_language_profile?: string;  // Trigger words, tone preferences
  persona_decision_style?: string;    // How they make decisions
}

// ─── B: CREATIVE BRIEF (v2 — @deprecated, use ConceptSpec) ──

/** @deprecated Use ConceptSpec instead. Kept for backward compat during migration. */
// Creative archetype is now a FREE string — Claude assigns whatever
// visual approach best serves the marketing angle. No predefined list.
export type CreativeArchetypeId = string;

export type HookType =
  | "pattern_interrupt"
  | "curiosity_gap"
  | "social_proof_shock"
  | "before_after"
  | "us_vs_them"
  | "emotional_mirror"
  | "instant_benefit"
  | "fear_of_missing"
  | "authority_signal"
  | "identity_call";

export type RenderMode = "scene_first" | "product_first";
export type OverlayIntent = "headline_cta" | "badge_proof" | "minimal" | "full_ad";
export type TextDensity = "none" | "low" | "medium" | "high";

export type MarketingAngle =
  | "desire"          // What the customer dreams of getting
  | "fear"            // What the customer is afraid of
  | "objection"       // Why they haven't bought yet — bust the myth
  | "identity"        // Who they want to be seen as
  | "social_proof"    // Everyone else already made this choice
  | "disruption"      // Challenge category norms / the competition
  | "aspiration"      // The life they aspire to
  | "curiosity"       // Intrigue, open a loop
  | "urgency"         // Act now or lose out
  | "guilt_relief";   // Remove the guilt of a current behavior

/** @deprecated Use ConceptSpec instead. Kept for backward compat during migration. */
export interface CreativeBrief {
  // ─── CUSTOMER-FIRST STRATEGY ─────────────────────────
  customer_insight: string;         // The specific customer truth this ad exploits
  marketing_angle: MarketingAngle;  // The psychological lever
  learning_hypothesis: string;      // "If this ad performs, it means our audience..."

  // ─── CREATIVE EXECUTION ──────────────────────────────
  hook_type: HookType;
  creative_archetype: CreativeArchetypeId; // Free string — Claude assigns the visual approach
  single_visual_idea: string;
  promise: string;
  proof_to_show: string;
  emotional_mechanic: string;
  awareness_level: string;
  meta_goal: string;
  why_this_should_stop_scroll: string;
  risks: string;
  copy_safe_zone: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  realism_target: "photorealistic" | "stylized_photo" | "editorial" | "graphic_design" | "mixed_media";
  headline_suggestion?: string;
  cta_suggestion?: string;

  // ─── BATCH LOCKING ──────────────────────────────────
  campaignThesis?: string;
  lockedPromise?: string;
  lockedProof?: string;

  // ─── RENDER MODE & COMPOSITION ──────────────────────
  renderMode?: RenderMode;
  overlayIntent?: OverlayIntent;
  textDensity?: TextDensity;
}

// ─── B v3: CONCEPT SPEC (replaces CreativeBrief) ────────────
// The new structured concept specification with closed taxonomies.
// Every field is either a taxonomy value or a well-typed string.

export interface ConceptSpec {
  // ─── STRATEGY (the ad's mission) ──────────────────────
  ad_job: AdJob;                           // Primary mission in funnel
  format_family: FormatFamily;             // Structural blueprint
  awareness_stage: AwarenessStage;         // Customer awareness level
  marketing_lever: MarketingLever;         // Psychological lever (secondary to ad_job)

  // ─── BELIEF ARCHITECTURE ──────────────────────────────
  belief_shift: string;                    // "FROM [current belief] → TO [new belief]"
  proof_mechanism: ProofMechanism;         // How the ad proves its claim
  proof_text?: string;                     // Visible proof copy (e.g., "4.8★ · 12 000 avis")

  // ─── VISUAL DIRECTION ────────────────────────────────
  layout_family: LayoutFamily;             // How the ad is composed
  render_family: RenderFamily;             // Photo vs Design vs Hybrid
  rupture_structure: RuptureStructure;     // The visual scroll-stop device
  graphic_tension: GraphicTension;         // Compositional tension
  visual_style: VisualStyle;              // Controlled aesthetic mode
  style_mode: StyleMode;                  // Brand compatibility tier
  human_presence: HumanPresence;          // None / hand / face / body

  // ─── SCENE DESCRIPTION ───────────────────────────────
  visual_device: string;                   // The ONE visual idea (3-4 sentences, scene only)
  product_role: "hero" | "supporting" | "contextual" | "absent";
  background_treatment: "minimal" | "contextual" | "storytelling" | "abstract" | "gradient";
  contrast_principle: string;              // What visual tension drives the composition

  // ─── COPY & MODULES ──────────────────────────────────
  headline: string;                        // 3-8 words, tied to marketing lever
  cta: string;                             // 2-5 words, never "acheter maintenant"
  offer_module?: string;                   // e.g., "-20% avec REBELLE20" or null
  text_zone_spec: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

  // ─── CUSTOMER INTELLIGENCE ───────────────────────────
  customer_insight: string;                // Deep customer truth (not product benefit)
  learning_hypothesis: string;             // "If this ad performs, it means..."

  // ─── PRE-RENDER SCORING (planner self-assessment) ────
  novelty_score: number;                   // 1-10: How fresh/surprising is this concept?
  clarity_score: number;                   // 1-10: How instantly readable?
  brand_fit_score: number;                 // 1-10: How aligned with brand codes?

  // ─── RENDER PROPERTIES ───────────────────────────────
  render_mode: RenderMode;                 // scene_first | product_first
  overlay_intent: OverlayIntent;           // headline_cta | badge_proof | minimal | full_ad
  text_density: TextDensity;               // none | low | medium | high
  realism_target: "photorealistic" | "stylized_photo" | "editorial" | "graphic_design" | "mixed_media";

  // ─── BATCH LOCKING ───────────────────────────────────
  campaign_thesis?: string;
  locked_promise?: string;
  locked_proof?: string;

  // ─── STYLE REFERENCE ─────────────────────────────────
  style_reference?: string;                // Description of the visual reference or mood
}

// ─── B2: CRITIC SCORES ──────────────────────────────────────
// Pre-render evaluation to filter weak concepts before rendering.

export interface CriticScores {
  // ─── 10 evaluation criteria (1-10) ────────────────────
  stop_scroll: number;           // Will this stop the scroll in 0.3s?
  message_clarity: number;       // Is the message instantly readable?
  ad_likeness: number;          // Does this look like a real Meta ad?
  proof_strength: number;       // Is the proof mechanism credible?
  visual_hierarchy: number;     // Is there a clear reading order?
  thumb_readability: number;    // Readable at mobile thumb size?
  product_visibility: number;   // Is the product prominent enough?
  brand_fit: number;            // Consistent with brand codes?
  novelty: number;              // Fresh vs. already-seen?
  renderability: number;        // Can an AI image model execute this well?
  confusion_risk: number;       // 1=clear, 10=very confusing (inverted)

  // ─── Computed ─────────────────────────────────────────
  composite_score: number;      // Weighted average of above
  pass: boolean;                // Above threshold?
  rejection_reason?: string;    // Why it failed (if !pass)
}

export interface ScoredConcept {
  concept: ConceptSpec;
  scores: CriticScores;
  rank: number;
}

// ─── C v3: AD DIRECTOR SPEC (replaces ArtDirection) ─────────
// Directs a META AD, not just a photo shoot.

export interface AdDirectorSpec {
  // ─── AD STRUCTURE (reading path) ─────────────────────
  reading_order: string;         // "eye_path: attention_anchor → headline → proof → CTA"
  eye_path: string;              // Description of the visual scanning path
  attention_anchor: string;      // What grabs the eye first
  grid_system: string;           // e.g., "3-column, product right-third, copy left-third"

  // ─── AD MODULES (pub components) ─────────────────────
  headline_container_style: string;  // e.g., "white pill on dark gradient, 48px bold"
  proof_block_style?: string;        // e.g., "5-star chip, yellow, bottom-left"
  offer_module_position?: string;    // e.g., "floating ribbon, top-right, red"
  cta_prominence: "subtle" | "medium" | "dominant";
  brand_bar?: string;               // e.g., "8px bottom strip, brand primary color"

  // ─── PRODUCT DIRECTION ───────────────────────────────
  product_scale: number;         // 0.0-1.0, proportion in frame
  product_placement: string;     // e.g., "right-third, slightly below center"
  product_anchoring: ProductAnchoring;

  // ─── VISUAL DIRECTION (from v2, preserved) ───────────
  composition: string;
  focal_point: string;
  camera: string;
  framing: string;
  lighting: string;
  environment: string;
  color_direction: string;
  texture_priority: string;
  prop_list: string[];

  // ─── ZONES & SPACE ───────────────────────────────────
  safe_zone: { position: string; percentage: number };
  overlay_map: OverlayMap;
  negative_space_shape?: string;  // e.g., "L-shaped void at top-left for headline stack"

  // ─── CONSTRAINTS ─────────────────────────────────────
  text_density_budget: TextDensity;
  character_budget_headline: number;  // Max chars for headline
  must_keep: string[];
  avoid: string[];

  // ─── RENDER-FAMILY SPECIFIC ──────────────────────────
  // photo_led: full photo specs
  // design_led: gradient, geometry, blocks
  // hybrid: mix of both
  render_family_specs?: {
    gradient_spec?: string;      // For design_led: "linear 135deg, #1a1a2e → #16213e"
    geometry_elements?: string;  // For design_led: "circle behind product, geometric lines"
    photo_scene_spec?: string;   // For photo_led: full scene description
    blend_mode?: string;        // For hybrid: how photo + design merge
  };

  // ─── REFERENCE STRATEGY ──────────────────────────────
  reference_strategy: ReferenceStrategy;
}

// ─── C: ART DIRECTION (v2 — @deprecated, use AdDirectorSpec) ─

/** @deprecated Use AdDirectorSpec instead. Kept for backward compat during migration. */
export interface ArtDirection {
  composition: string;
  focal_point: string;
  camera: string;
  framing: string;
  lighting: string;
  environment: string;
  prop_list: string[];
  product_role: "hero" | "supporting" | "contextual" | "absent";
  background_role: "minimal" | "contextual" | "storytelling" | "abstract";
  safe_zone: { position: string; percentage: number };
  texture_priority: string;
  realism_target: string;
  color_direction: string;
  must_keep: string[];
  avoid: string[];
  reference_strategy: ReferenceStrategy;
  // v2 — overlay & product anchoring
  overlay_map?: OverlayMap;
  product_anchoring?: ProductAnchoring;
}

export interface OverlayMap {
  headline_zone: string;
  cta_zone: string;
  badge_zone?: string;
  proof_zone?: string;
  forbidden_zones: string[];
  quiet_zones: string[];
}

export interface ProductAnchoring {
  position: "center" | "left-third" | "right-third" | "bottom-center" | "top-center";
  scale: number;
  perspective_angle: number;
  contact_shadow_required: boolean;
  occlusion_allowed: boolean;
  packaging_geometry_locked: boolean;
}

export interface ReferenceStrategy {
  use_product_ref: boolean;
  product_ref_role: "exact_reproduction" | "style_guide" | "color_reference";
  use_style_ref: boolean;
  style_ref_description?: string;
  preferred_ref_indices?: number[];
}

// ─── D: BUILT PROMPT ────────────────────────────────────────

export interface BuiltPrompt {
  prompt_for_model: string;
  edit_prompt_round_2: string;
  selected_reference_images: SelectedReference[];
  image_generation_config: ImageGenerationConfig;
}

export interface SelectedReference {
  path: string;
  role: "product_fidelity" | "texture_material" | "packaging" | "usage" | "style_mood" | "inspiration" | "layout_structure" | "brand_style";
  buffer?: Buffer;
}

// ─── D2: AD COPY (Phase 5+) ────────────────────────────────

export interface AdCopy {
  headline: {
    text: string;           // 2-15 mots
    wordCount: number;
    lines: number;          // 2-3 lignes max
    tone: string;           // "urgent" | "inspirant" | "provocateur"
  };
  subtitle?: {
    text: string;           // 5-25 mots
    wordCount: number;
  };
  cta: {
    text: string;           // 2-5 mots
    urgency: "low" | "medium" | "high";
  };
  proofText?: string;       // "4.8★ · 12,000 avis"
  offerModule?: string;     // "-20% avec CODE20"
}

// ─── D3: AD-FOCUSED PROMPT STRUCTURE (Phase 5+) ──────────────

export interface AdPromptStructure {
  // === MISSION (pourquoi cette image existe) ===
  adJob: string;              // scroll_stop | educate | prove | convert
  adPurpose: string;          // "Stop scroll en 0.3s en montrant..."
  beliefShift: {
    from: string;             // "Je pense que..."
    to: string;               // "Je comprends que..."
  };

  // === COPY (texte a superposer) ===
  copy: {
    headline: string;         // 2-15 mots, francais, impactant
    subtitle?: string;        // 5-25 mots optionnel
    cta: string;              // 2-5 mots
  };

  // === LAYOUT (structure visuelle) ===
  layout: {
    family: string;           // split_screen, hero_product, etc.
    gridSystem: string;       // "3-column: left 45% copy | right 50% product"
    readingOrder: string;     // "Z-pattern: headline → product → CTA"
    safeZones: {
      headline: string;       // "top-left 40%"
      cta: string;            // "bottom-right 20%"
      forbidden: string[];    // ["center product area"]
    };
  };

  // === FOCUS (hierarchie visuelle) ===
  focus: {
    attentionAnchor: string;  // "Le produit en gros plan"
    eyePath: string;          // "Produit → headline → CTA"
    productRole: string;      // "hero" | "supporting" | "subtle"
    productPlacement: string; // "right-third, 40% frame"
  };

  // === SCENE (ambiance, decor) ===
  scene: {
    visualDevice: string;     // Description de la scene
    environment: string;      // Decor, props
    lighting: string;         // Eclairage
    mood: string;             // Atmosphere
    colorTone: string;        // Palette
  };

  // === REFERENCES ===
  references: {
    product: SelectedReference[];     // Images produit
    layoutInspiration?: Buffer;       // Screenshot layout
    brandStyle?: Buffer[];            // Visuels marque
    styleDescription?: string;        // Comment utiliser les refs
  };

  // === INTERDITS ===
  avoid: string[];            // Liste des interdits
}

export interface ImageGenerationConfig {
  aspect_ratio: string;
  quality: "standard" | "high";
  style_preset?: string;
}

// ─── E: RENDER RESULT ───────────────────────────────────────

export interface RenderResult {
  concept_index: number;
  brief: CreativeBrief;
  art_direction: ArtDirection;
  base_image: {
    buffer: Buffer;
    mime_type: string;
    prompt_used: string;
  };
  edited_image?: {
    buffer: Buffer;
    mime_type: string;
    edit_prompt_used: string;
  };
  final_image: Buffer;
  final_mime_type: string;
  generation_metadata: {
    pass_1_success: boolean;
    pass_2_success: boolean;
    pass_2_attempted: boolean;
    total_api_calls: number;
    reference_images_used: number;
  };
}

// ─── F: EVALUATION ──────────────────────────────────────────

export interface CraftScore {
  realism: number;
  product_fidelity: number;
  composition_quality: number;
  lighting_quality: number;
  premium_visual_feel: number;
  material_coherence: number;
  overall_craft: number;
}

export interface AdPerformanceScore {
  stop_scroll_power: number;
  instant_clarity: number;
  visible_promise: number;
  visible_proof: number;
  meta_native_feel: number;
  visual_distinctiveness: number;
  text_overlay_readiness: number;
  likelihood_to_win_in_feed: number;
  overall_ad: number;
}

export interface ImageEvaluation {
  craft: CraftScore;
  ad_performance: AdPerformanceScore;
  combined_score: number;
  strengths: string[];
  weaknesses: string[];
  edit_suggestions: string[];
}

export interface PairwiseRanking {
  best_for_scroll_stop: number;
  best_for_product_showcase: number;
  best_for_promise_communication: number;
  best_for_premium_feel: number;
  best_overall_for_meta_feed: number;
  ranking_rationale: string;
}

export interface BatchEvaluation {
  individual_scores: ImageEvaluation[];
  pairwise: PairwiseRanking;
}

// ─── J: BATCH LOCKING ──────────────────────────────────────

export interface BatchLockConfig {
  campaignThesis: string;
  lockedPromise: string;
  lockedProof: string;
}

// ─── H: QUALITY GATES ──────────────────────────────────────

export type GateAction =
  | "accept"
  | "reject"
  | "fallback_to_pass1"
  | "fallback_to_simpler_template"
  | "mark_high_risk";

export interface GateVerdict {
  action: GateAction;
  reasons: string[];
  scores: Record<string, number>;
  confidence: number;
}

export interface RenderGateChecks {
  product_looks_pasted: number;
  safe_zone_usable: number;
  product_fidelity_risk: number;
  perspective_coherent: number;
}

// ─── G: COMPOSER / LAYOUT ENGINE ───────────────────────────

export interface CopyAssets {
  headline: string;
  subtitle?: string;
  proof?: string;
  badge?: string;
  cta?: string;
  brandName: string;
  // v3 enrichments from ConceptSpec
  offer?: string;        // e.g., "-20% avec REBELLE20"
  rating?: string;       // e.g., "4.8★ · 12 000 avis"
  ingredient?: string;   // e.g., "Enrichi en vitamine C"
}

export type LayoutZoneId =
  | "headline"
  | "subtitle"
  | "proof"
  | "badge"
  | "cta"
  | "product"
  | "forbidden"
  | "quiet";

export interface LayoutZone {
  id: LayoutZoneId;
  x: number;
  y: number;
  width: number;
  height: number;
  minFontSize: number;
  maxFontSize: number;
  fontWeight: string;
  alignment: "left" | "center" | "right";
  priority: number;
}

export interface LayoutTemplate {
  id: string;  // Now matches LayoutFamily from taxonomy.ts
  name: string;
  zones: LayoutZone[];
  /** @deprecated — selection is now by LayoutFamily direct match */
  applicableTo?: CreativeArchetypeId[];
  safeZonePosition: string;
  productAnchor?: "center" | "left" | "right" | "top" | "bottom";
}

export interface ComposerInput {
  image: Buffer;
  mimeType: string;
  brief: CreativeBrief;
  artDirection: ArtDirection;
  context: FilteredContext;
  renderMode: RenderMode;
  overlayIntent: OverlayIntent;
  textDensity: TextDensity;
  copyAssets: CopyAssets;
  aspectRatio: string;
  // v3 additions for taxonomy-driven module selection
  layoutFamily?: string;        // Direct layout selection by LayoutFamily
  proofMechanism?: string;      // For proof module selection
  formatFamily?: string;        // For module selection
}

export interface CollisionReport {
  zone1: string;
  zone2: string;
  overlapArea: number;
  resolved: boolean;
  resolution: string;
}

export interface ComposedAd {
  buffer: Buffer;
  mimeType: string;
  layoutUsed: string;
  zonesUsed: string[];
  collisions: CollisionReport[];
  fallbacksApplied: string[];
  copyAssets: CopyAssets;
}

// ─── K: DUAL EVALUATION ────────────────────────────────────

export interface BaseImageEvaluation {
  craft: CraftScore;
  ad_performance: AdPerformanceScore;
  combined_score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComposedAdEvaluation {
  stop_scroll_power: number;
  message_clarity: number;
  mobile_readability: number;
  visual_cohesion: number;
  text_legibility: number;
  hierarchy_effectiveness: number;
  cta_visibility: number;
  brand_consistency: number;
  overall_composed: number;
  improvement_notes: string[];
}

export interface DualEvaluation {
  base: BaseImageEvaluation;
  composed: ComposedAdEvaluation;
  final_score: number;
}

export interface DualBatchEvaluation {
  individual: DualEvaluation[];
  pairwise: PairwiseRanking;
}

// ─── PIPELINE EVENT (for SSE streaming) ─────────────────────

export type PipelineEvent =
  | { type: "phase"; phase: string; message: string }
  | { type: "context_filtered"; context: FilteredContext }
  | { type: "batch_locked"; lock: BatchLockConfig }
  // v2 (deprecated)
  | { type: "briefs_generated"; briefs: CreativeBrief[] }
  | { type: "art_direction"; index: number; direction: ArtDirection }
  // v3 (new)
  | { type: "concepts_generated"; concepts: ConceptSpec[] }
  | { type: "concepts_scored"; scored: ScoredConcept[]; kept: number; rejected: number }
  | { type: "ad_direction"; index: number; direction: AdDirectorSpec }
  // shared
  | { type: "prompt_built"; index: number; prompt_preview: string }
  | { type: "render_pass_1"; index: number; success: boolean }
  | { type: "render_pass_2"; index: number; success: boolean }
  | { type: "render_gate"; index: number; verdict: GateVerdict }
  | { type: "composing"; index: number; layout: string }
  | { type: "composed"; index: number; layoutUsed: string; fallbacks: string[] }
  | { type: "composition_gate"; index: number; verdict: GateVerdict }
  | { type: "base_evaluation"; index: number; scores: BaseImageEvaluation }
  | { type: "composed_evaluation"; index: number; scores: ComposedAdEvaluation }
  | { type: "image_ready"; index: number; image_id: string; url: string; brief: CreativeBrief }
  | { type: "evaluation"; scores: ImageEvaluation; index: number }
  | { type: "ranking"; ranking: PairwiseRanking }
  | { type: "complete"; generation_id: string; completed: number; failed: number; total: number }
  | { type: "error"; index?: number; error: string };
