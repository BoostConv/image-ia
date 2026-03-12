// ============================================================
// KNOWLEDGE BASE — Types
// Global methodology shared across all clients/brands.
// Per-brand knowledge comes from the existing documents system.
// ============================================================

export type AwarenessLevel =
  | "unaware"
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "most_aware";

export type PipelineStage =
  | "planner"
  | "art_director"
  | "prompt_builder"
  | "composer"
  | "evaluator"
  | "quality_gate";

/**
 * Knowledge slice injected into a pipeline stage's prompt.
 */
export interface StageKnowledge {
  /** Schwartz persuasion + psychology methodology */
  methodology: string;
  /** Neuro-design + visual concept rules */
  visual_rules: string;
  /** Headline templates + copywriting rules */
  copy_rules: string;
  /** Advanced tactics (biases, villain technique, etc.) */
  tactics: string;
}

/**
 * Headline template organized by funnel stage.
 */
export interface HeadlineTemplate {
  category: "pain" | "desire" | "proof" | "urgency" | "curiosity" | "authority" | "transformation";
  template: string;
  funnel: "tofu" | "mofu" | "bofu";
  awareness: AwarenessLevel[];
}

/**
 * Visual concept tied to awareness level.
 */
export interface VisualConcept {
  awareness: AwarenessLevel;
  concept: string;
  scene_type: string;
  product_role: "hero" | "supporting" | "contextual" | "absent";
}

/**
 * Neuro-design principle for visual hierarchy.
 */
export interface NeuroDesignRule {
  principle: string;
  application: string;
  stages: PipelineStage[];
}
