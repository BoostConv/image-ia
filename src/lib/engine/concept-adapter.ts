import type { ConceptSpec, CreativeBrief, MarketingAngle, HookType } from "./types";

// ============================================================
// CONCEPT ADAPTER — ConceptSpec → CreativeBrief bridge
//
// During Pipeline v3 migration, downstream modules (art-director,
// prompt-builder, renderer, composer) still expect CreativeBrief.
// This adapter converts ConceptSpec to CreativeBrief so the
// pipeline can use the new planner while keeping the rest stable.
//
// Will be removed when all downstream modules are migrated to v3.
// ============================================================

/**
 * Convert a ConceptSpec (v3) to a CreativeBrief (v2).
 * Maps new taxonomy fields to legacy free-form fields.
 */
export function conceptToBrief(concept: ConceptSpec): CreativeBrief {
  return {
    // ─── Customer-first strategy ──────────────────────
    customer_insight: concept.customer_insight,
    marketing_angle: concept.marketing_lever as MarketingAngle,
    learning_hypothesis: concept.learning_hypothesis,

    // ─── Creative execution ───────────────────────────
    hook_type: mapAdJobToHookType(concept.ad_job, concept.marketing_lever),
    creative_archetype: `${concept.format_family}__${concept.visual_style}`, // Synthetic archetype ID
    single_visual_idea: concept.visual_device,
    promise: concept.belief_shift,
    proof_to_show: concept.proof_text || `Preuve via ${concept.proof_mechanism}`,
    emotional_mechanic: `${concept.marketing_lever}: ${concept.contrast_principle}`,
    awareness_level: concept.awareness_stage,
    meta_goal: `${concept.ad_job} — ${concept.format_family}`,
    why_this_should_stop_scroll: `${concept.rupture_structure} × ${concept.graphic_tension}`,
    risks: concept.novelty_score >= 8 ? "Concept très novateur — risque d'exécution IA" : "Standard",
    copy_safe_zone: concept.text_zone_spec,
    realism_target: concept.realism_target,
    headline_suggestion: concept.headline,
    cta_suggestion: concept.cta,

    // ─── Batch locking ────────────────────────────────
    campaignThesis: concept.campaign_thesis,
    lockedPromise: concept.locked_promise,
    lockedProof: concept.locked_proof,

    // ─── Render mode & composition ────────────────────
    renderMode: concept.render_mode,
    overlayIntent: concept.overlay_intent,
    textDensity: concept.text_density,
  };
}

/**
 * Convert a batch of ConceptSpecs to CreativeBriefs.
 */
export function conceptsToBriefs(concepts: ConceptSpec[]): CreativeBrief[] {
  return concepts.map(conceptToBrief);
}

// ─── Mapping helpers ────────────────────────────────────────

/**
 * Map ad_job + marketing_lever to the closest HookType.
 * This is a rough mapping — the new taxonomy is more precise.
 */
function mapAdJobToHookType(
  adJob: string,
  lever: string
): HookType {
  // Ad job takes priority
  switch (adJob) {
    case "scroll_stop":
      return "pattern_interrupt";
    case "educate":
      return "curiosity_gap";
    case "prove":
      return "authority_signal";
    case "handle_objection":
      return "us_vs_them";
    case "convert_offer":
      return "instant_benefit";
  }

  // Fall back to marketing lever
  switch (lever) {
    case "desire":
      return "instant_benefit";
    case "fear":
      return "fear_of_missing";
    case "objection":
      return "us_vs_them";
    case "identity":
      return "identity_call";
    case "social_proof":
      return "social_proof_shock";
    case "disruption":
      return "pattern_interrupt";
    case "aspiration":
      return "emotional_mirror";
    case "curiosity":
      return "curiosity_gap";
    case "urgency":
      return "fear_of_missing";
    case "guilt_relief":
      return "emotional_mirror";
    default:
      return "pattern_interrupt";
  }
}
