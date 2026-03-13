// ============================================================
// KNOWLEDGE BASE — Barrel Export (v2 — Enriched with PDF content)
// Global methodology shared across all clients/brands.
// Per-brand knowledge comes from the existing documents system.
// ============================================================

export type { AwarenessLevel, PipelineStage, StageKnowledge } from "./types";

// Core selector functions
export { getKnowledgeForStage, getKnowledgeForPattern } from "./selector";

// ─── Original modules (still used for backward compat) ─────
export { AWARENESS_STRATEGIES, getSchwartzDirective, SOPHISTICATION_STAGES, BREAKTHROUGH_TECHNIQUES } from "./schwartz-persuasion";
export { VISUAL_CONCEPTS, STYLE_MODES, LAYOUT_RULES, VISUAL_HYGIENE, getConceptsForAwareness, getVisualConceptDirective } from "./visual-concepts";
export { NEURO_DESIGN_PRINCIPLES, COLOR_PSYCHOLOGY, MOBILE_RULES, getNeuroDesignDirective } from "./neuro-design";
export { MAKEPEACE_RULES, POWER_WORDS, BANNED_SOFT_WORDS, getCopywritingDirective } from "./copywriting-rules";
export { MINDSTATE_PROFILES, COGNITIVE_BIASES, EMOTION_WHEEL, PATTERN_INTERRUPT, getMindstateForAwareness, getBiasesForAwareness, getPsychologyDirective } from "./psychology";
export { VILLAIN_TECHNIQUE, OBJECTION_HANDLERS, EMOTIONAL_TACTICS, MOMENTS_OF_TRUTH, HEADLINE_STRENGTHENERS, getTacticsDirective } from "./advanced-tactics";
export { VISUAL_HEADLINES, CAPTION_HEADLINES, TEXT_ON_IMAGE_RULES } from "./headlines";

// ─── NEW: Enriched knowledge from PDFs ─────────────────────
// 20 Persuasive Patterns + 50+ Sub-types
export { PERSUASIVE_PATTERNS, PATTERN_SELECTION_MATRIX, getPatternDirective, getPatternsForAwarenessDirective, getAllPatternsForAwarenessDirective, COMBINATORICS_REMINDER } from "./patterns-library";

// 100 Layouts Library
export { LAYOUTS, LAYOUT_CATEGORIES, getLayoutsForPattern, getLayoutsForCategory, getLayoutDirective, getLayoutCategorySummary, getLayoutsForFormats } from "./layouts-library";

// Evaluator Calibration (P6)
export { getBaseImageCalibrationDirective, getComposedAdCalibrationDirective } from "./evaluator-calibration";

// Complete Copywriting Framework (13 mechanisms, Ford rules, emotional motivators)
export { FORD_SELLING_RULES, CORE_PRINCIPLES, EMOTIONAL_MOTIVATORS, EMOTIONAL_SELECTION_FRAMEWORK, HEADLINE_MECHANISMS, COPY_ZONES, WORD_BUDGET, COPY_VISUAL_COHERENCE, ADVANCED_TECHNIQUES, FORBIDDEN_FORMULATIONS, COPY_CHECKLIST, BRAND_APPROACHES, FACEBOOK_AD_COPY_RULES, getCopywritingFrameworkDirective, getHeadlineMechanismDirective, getAllHeadlineMechanismsDirective } from "./copywriting-framework";

// Content Brief & Visual Hierarchy (visual psychology, anti-AI, ugly ads, checklists)
export { VISUAL_PSYCHOLOGY, READING_PATTERNS, CONTENT_BRIEF_ANATOMY, ANTI_AI_RULES, UGLY_ADS, VISUAL_FOR_PATTERNS, GAZE_RULES, VISUAL_GUARD_RAILS, CONTENT_BRIEF_CHECKLIST, DIVERSIFICATION_RULES, PRIORITY_ORDER, getContentBriefDirective, getVisualForPatternDirective } from "./content-brief-rules";
