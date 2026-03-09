// ============================================================
// ENGINE TYPES — Pipeline v2
// A: ContextFilter → J: BatchLocker → B: CreativePlanner →
// C: ArtDirector → D: PromptBuilder → E: Renderer →
// H1: RenderGate → G: Composer → H2: CompositionGate →
// K: DualEvaluator → F: Ranking
// ============================================================

// ─── RAW INPUT (from DB) ────────────────────────────────────

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
  };
  brief?: string;
  format: string;
  aspectRatio: string;
  count: number;
  guidelinesPrompt?: string;
  documentsPrompt?: string;
  inspirationPrompt?: string;
  /** "clean" = no-text image + SVG overlay, "complete_ad" = full ad with text generated natively */
  renderStrategy?: "clean" | "complete_ad";
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
}

// ─── B: CREATIVE BRIEF ─────────────────────────────────────

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

// ─── C: ART DIRECTION ───────────────────────────────────────

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
  role: "product_fidelity" | "texture_material" | "packaging" | "usage" | "style_mood" | "inspiration";
  buffer?: Buffer;
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
  id: string;
  name: string;
  zones: LayoutZone[];
  applicableTo: CreativeArchetypeId[];
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
  | { type: "briefs_generated"; briefs: CreativeBrief[] }
  | { type: "art_direction"; index: number; direction: ArtDirection }
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
