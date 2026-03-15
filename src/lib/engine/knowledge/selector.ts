import type { AwarenessLevel, PipelineStage, StageKnowledge } from "./types";
import { getSchwartzDirective } from "./schwartz-persuasion";
import { getVisualConceptDirective } from "./visual-concepts";
import { getNeuroDesignDirective } from "./neuro-design";
import { getCopywritingDirective } from "./copywriting-rules";
import { getPsychologyDirective } from "./psychology";
import { getTacticsDirective } from "./advanced-tactics";
import { TEXT_ON_IMAGE_RULES, CAPTION_HEADLINES } from "./headlines";

// ─── NEW: Enriched knowledge from PDFs ─────────────────────
import { getPatternsForAwarenessDirective, getPatternDirective, COMBINATORICS_REMINDER } from "./patterns-library";
import { getLayoutCategorySummary, getLayoutsForFormats } from "./layouts-library";
import { getCopywritingFrameworkDirective, getAllHeadlineMechanismsDirective } from "./copywriting-framework";
import { getContentBriefDirective } from "./content-brief-rules";

// ============================================================
// KNOWLEDGE SELECTOR (v2 — Enriched with PDF knowledge base)
// Context-aware filtering of global methodology knowledge.
// Returns the right knowledge slice for each pipeline stage.
// Each stage gets ONLY what it needs (~3-5K chars, not 195K).
// ============================================================

/**
 * Get knowledge for a specific pipeline stage and awareness level.
 * Each stage gets a tailored subset of methodology knowledge.
 * @param formatFamilies Optional format families for layout filtering (planner only)
 * @param brandTone Optional brand tone for filtering inappropriate knowledge (e.g. UGLY ADS for premium brands)
 */
export function getKnowledgeForStage(
  stage: PipelineStage,
  awareness: AwarenessLevel,
  formatFamilies?: string[],
  brandTone?: string,
): StageKnowledge {
  switch (stage) {
    case "planner":
      return getPlannerKnowledge(awareness, formatFamilies, brandTone);
    case "art_director":
      return getArtDirectorKnowledge(awareness);
    case "prompt_builder":
      return getPromptBuilderKnowledge(awareness);
    case "composer":
      return getComposerKnowledge(awareness);
    case "evaluator":
      return getEvaluatorKnowledge(awareness);
    case "quality_gate":
      return getQualityGateKnowledge(awareness);
    default:
      return getDefaultKnowledge(awareness);
  }
}

/**
 * Get enriched knowledge for a specific pattern choice.
 * Called AFTER the planner selects a pattern, to give downstream stages
 * detailed pattern-specific knowledge.
 */
export function getKnowledgeForPattern(
  patternId: string,
  awareness: AwarenessLevel
): StageKnowledge {
  return {
    methodology: getPatternDirective(patternId),
    visual_rules: getContentBriefDirective("art_director"),
    copy_rules: getCopywritingFrameworkDirective("composer"),
    tactics: getTacticsDirective(awareness),
  };
}

// ─── PLANNER (Layer B) ───────────────────────────────────────
// Gets: Schwartz strategy + patterns for awareness + layouts + copywriting principles
// This is the MOST knowledge-heavy stage.

function getPlannerKnowledge(awareness: AwarenessLevel, formatFamilies?: string[], brandTone?: string): StageKnowledge {
  // P5 optimization: use filtered layouts if format families are known
  const layoutDirective = formatFamilies && formatFamilies.length > 0
    ? getLayoutsForFormats(formatFamilies)
    : getLayoutCategorySummary();

  // P5: use compact tactics (first line only as summary)
  const fullTactics = getTacticsDirective(awareness);
  const compactTactics = fullTactics.split("\n").slice(0, 8).join("\n");

  return {
    methodology: `${getSchwartzDirective(awareness)}

${getPatternsForAwarenessDirective(awareness)}

${COMBINATORICS_REMINDER}`,
    visual_rules: `${getVisualConceptDirective(awareness)}

${layoutDirective}

${getContentBriefDirective("planner", brandTone)}`,
    copy_rules: `${getCopywritingFrameworkDirective("planner")}`,
    tactics: compactTactics,
  };
}

// ─── ART DIRECTOR (Layer C) ────────────────────────────────
// Gets: Neuro-design + visual psychology + content brief rules + anti-AI

function getArtDirectorKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: getPsychologyDirective(awareness),
    visual_rules: `${getNeuroDesignDirective()}

${getContentBriefDirective("art_director")}

${getVisualConceptDirective(awareness)}`,
    copy_rules: "",
    tactics: getTacticsDirective(awareness),
  };
}

// ─── PROMPT BUILDER (Layer D) ──────────────────────────────
// Gets: Content brief anatomy + anti-AI rules (compact)

function getPromptBuilderKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: "",
    visual_rules: getContentBriefDirective("prompt_builder"),
    copy_rules: "",
    tactics: "",
  };
}

// ─── COMPOSER (Layer G) ─────────────────────────────────────
// Gets: Full copywriting framework + headline mechanisms + templates

function getComposerKnowledge(awareness: AwarenessLevel): StageKnowledge {
  const funnelStage = awarenessToFunnel(awareness);
  const headlines = CAPTION_HEADLINES[funnelStage].slice(0, 5).join("\n- ");

  return {
    methodology: getSchwartzDirective(awareness),
    visual_rules: `HIERARCHIE TYPO:
- Headline: GRAND, GRAS, max ${TEXT_ON_IMAGE_RULES.maxHeadlineWords} mots, max ${TEXT_ON_IMAGE_RULES.maxCoveragePercent}% couverture
- Sub-headline: taille MOYENNE
- CTA: couleur d'accent, contraste fort
- ${TEXT_ON_IMAGE_RULES.contrast}`,
    copy_rules: `${getCopywritingFrameworkDirective("composer")}

13 MECANISMES DE HEADLINE:
${getAllHeadlineMechanismsDirective()}

TEMPLATES HEADLINE (${funnelStage.toUpperCase()}):
- ${headlines}`,
    tactics: getTacticsDirective(awareness),
  };
}

// ─── EVALUATOR (Layer K) ────────────────────────────────────
// Gets: Full evaluation checklists from enriched framework

function getEvaluatorKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: getSchwartzDirective(awareness),
    visual_rules: `CRITERES D'EVALUATION NEURO-DESIGN:
- Pattern Z respecte? Elements cles sur la trajectoire naturelle?
- Point focal unique clair?
- Contraste suffisant pour le CTA?
- Espace blanc adequat (pas surcharge)?
- Regard humain dirige vers produit/CTA?
- Lisible en 0.3s sur mobile?
- L'image seule (sans texte) communique-t-elle la promesse?`,
    copy_rules: getCopywritingFrameworkDirective("evaluator"),
    tactics: getPsychologyDirective(awareness),
  };
}

// ─── QUALITY GATE (Layer H) ─────────────────────────────────
// Gets: Full quality checklist from enriched content brief rules

function getQualityGateKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: "",
    visual_rules: getContentBriefDirective("quality_gate"),
    copy_rules: "",
    tactics: "",
  };
}

// ─── DEFAULT ─────────────────────────────────────────────────

function getDefaultKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: getSchwartzDirective(awareness),
    visual_rules: getNeuroDesignDirective(),
    copy_rules: getCopywritingDirective(),
    tactics: getTacticsDirective(awareness),
  };
}

// ─── HELPERS ─────────────────────────────────────────────────

function awarenessToFunnel(awareness: AwarenessLevel): "tofu" | "mofu" | "bofu" {
  switch (awareness) {
    case "unaware":
    case "problem_aware":
      return "tofu";
    case "solution_aware":
      return "mofu";
    case "product_aware":
    case "most_aware":
      return "bofu";
    default:
      return "mofu";
  }
}
