// ============================================================
// KNOWLEDGE BASE — Barrel Export
// Global methodology shared across all clients/brands.
// ============================================================

export type { AwarenessLevel, PipelineStage, StageKnowledge } from "./types";

// Core selector function
export { getKnowledgeForStage } from "./selector";

// Individual modules (for direct access if needed)
export { AWARENESS_STRATEGIES, getSchwartzDirective, SOPHISTICATION_STAGES, BREAKTHROUGH_TECHNIQUES } from "./schwartz-persuasion";
export { VISUAL_CONCEPTS, STYLE_MODES, LAYOUT_RULES, VISUAL_HYGIENE, getConceptsForAwareness, getVisualConceptDirective } from "./visual-concepts";
export { NEURO_DESIGN_PRINCIPLES, COLOR_PSYCHOLOGY, MOBILE_RULES, getNeuroDesignDirective } from "./neuro-design";
export { MAKEPEACE_RULES, POWER_WORDS, BANNED_SOFT_WORDS, getCopywritingDirective } from "./copywriting-rules";
export { MINDSTATE_PROFILES, COGNITIVE_BIASES, EMOTION_WHEEL, PATTERN_INTERRUPT, getMindstateForAwareness, getBiasesForAwareness, getPsychologyDirective } from "./psychology";
export { VILLAIN_TECHNIQUE, OBJECTION_HANDLERS, EMOTIONAL_TACTICS, MOMENTS_OF_TRUTH, HEADLINE_STRENGTHENERS, getTacticsDirective } from "./advanced-tactics";
export { VISUAL_HEADLINES, CAPTION_HEADLINES, TEXT_ON_IMAGE_RULES } from "./headlines";
