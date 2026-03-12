import type { AwarenessLevel, PipelineStage, StageKnowledge } from "./types";
import { getSchwartzDirective } from "./schwartz-persuasion";
import { getVisualConceptDirective } from "./visual-concepts";
import { getNeuroDesignDirective } from "./neuro-design";
import { getCopywritingDirective } from "./copywriting-rules";
import { getPsychologyDirective } from "./psychology";
import { getTacticsDirective } from "./advanced-tactics";
import { TEXT_ON_IMAGE_RULES, CAPTION_HEADLINES } from "./headlines";

// ============================================================
// KNOWLEDGE SELECTOR
// Context-aware filtering of global methodology knowledge.
// Returns the right knowledge slice for each pipeline stage.
// ============================================================

/**
 * Get knowledge for a specific pipeline stage and awareness level.
 * Each stage gets a tailored subset of methodology knowledge.
 */
export function getKnowledgeForStage(
  stage: PipelineStage,
  awareness: AwarenessLevel
): StageKnowledge {
  switch (stage) {
    case "planner":
      return getPlannerKnowledge(awareness);
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

// ─── PLANNER (Layer B) ───────────────────────────────────────
// Needs: Schwartz strategy, psychology, visual concept options

function getPlannerKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: getSchwartzDirective(awareness),
    visual_rules: getVisualConceptDirective(awareness),
    copy_rules: getCopywritingDirective(),
    tactics: getTacticsDirective(awareness),
  };
}

// ─── ART DIRECTOR (Layer C) ────────────────────────────────
// Needs: Neuro-design rules, visual concepts, psychology (mood)

function getArtDirectorKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: getPsychologyDirective(awareness),
    visual_rules: `${getNeuroDesignDirective()}\n\n${getVisualConceptDirective(awareness)}`,
    copy_rules: "", // Art director doesn't write copy
    tactics: getTacticsDirective(awareness),
  };
}

// ─── PROMPT BUILDER (Layer D) ──────────────────────────────
// Needs: Neuro-design (compact), visual hygiene. BUDGET ~200 chars extra.

function getPromptBuilderKnowledge(awareness: AwarenessLevel): StageKnowledge {
  // Prompt builder has strict char budget, so we give minimal directives
  return {
    methodology: "",
    visual_rules: `NEURO-DESIGN COMPACT:
- Point focal unique, Z-pattern, max 3-4 elements
- Espace blanc genereux autour du sujet
- Regard humain vers le produit (gaze cueing)
- Clean composition, uncluttered background, focus on subject
- Visible skin pores, natural skin texture si humains presents`,
    copy_rules: "",
    tactics: "",
  };
}

// ─── COMPOSER (Layer G) ─────────────────────────────────────
// Needs: Headline templates, copywriting rules, typography hierarchy

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
    copy_rules: `${getCopywritingDirective()}

TEMPLATES HEADLINE (${funnelStage.toUpperCase()}):
- ${headlines}`,
    tactics: getTacticsDirective(awareness),
  };
}

// ─── EVALUATOR (Layer K) ────────────────────────────────────
// Needs: Schwartz criteria, neuro-design checklist, psychology

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
    copy_rules: `CRITERES COPY:
- Max ${TEXT_ON_IMAGE_RULES.maxHeadlineWords} mots pour headline sur image
- Mots puissants utilises (Gratuit, Nouveau, Garanti)?
- Ton conversationnel (pas corporate)?
- Specifique (pas generique)?`,
    tactics: getPsychologyDirective(awareness),
  };
}

// ─── QUALITY GATE (Layer H) ─────────────────────────────────
// Needs: Neuro-design checklist, visual hygiene

function getQualityGateKnowledge(awareness: AwarenessLevel): StageKnowledge {
  return {
    methodology: "",
    visual_rules: `CHECKLIST QUALITE NEURO-DESIGN:
- Composition propre (clean composition)?
- Arriere-plan non encombre (uncluttered background)?
- Focus sur le sujet principal?
- Anti-plastique: pores visibles, texture peau naturelle si humains?
- Pas de texte genere par l'IA dans l'image?
- Coherence avatar: le visuel correspond-il a la cible?
- Methode Disney: formes fluides, pas agressives (sauf si voulu)?
- Fluidite perceptuelle: lisible en 0.3s?`,
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
