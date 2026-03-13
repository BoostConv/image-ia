import Anthropic from "@anthropic-ai/sdk";
import type { RawPipelineInput, FilteredContext, BatchLockConfig } from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";

// ============================================================
// LAYER A+J: CONTEXT FILTER + BATCH LOCKER (merged)
// Reduces raw brand/product/persona data to what matters for ONE ad.
// Extracts audience tension, promise, proof, emotional angle.
// Also derives the batch strategic lock (campaign thesis, promise, proof).
// Saves 1 Claude call (~4s latency) vs. separate batch-locker.
// ============================================================

const getClient = () => new Anthropic();

export interface FilterContextResult {
  context: FilteredContext;
  lock: BatchLockConfig;
}

export async function filterContext(input: RawPipelineInput): Promise<FilterContextResult> {
  const client = getClient();

  const rawContext = buildRawContextDump(input);

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2300,
    system: `Tu es un strategiste publicitaire senior. Ta mission : extraire d'un contexte brut les SEULS elements qui comptent pour creer une publicite performante sur Meta (Facebook/Instagram).

Ne garde que l'essentiel. Pas de blabla. Chaque champ doit etre actionnable pour un directeur creatif.

Definis aussi le socle strategique commun pour le batch : une these de campagne, une promesse pub formulee, et la preuve la plus forte formulee visuellement. Tous les visuels du batch partageront ce socle — seuls l'archetype visuel, le hook, la composition et l'ambiance varient.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: `Analyse ce contexte brut et extrais les elements strategiques pour creer des ads performantes.

=== CONTEXTE BRUT ===
${rawContext}

=== FORMAT DE SORTIE ===
{
  "audience_tension": "La tension/frustration principale de l'audience cible (1 phrase percutante)",
  "promise": "La promesse unique du produit (1 phrase)",
  "proof": "La preuve la plus forte pour soutenir la promesse (fait, chiffre, mecanisme)",
  "emotional_angle": "L'emotion dominante a exploiter (peur, desir, fierte, liberation, etc.)",
  "awareness_level": "unaware|problem_aware|solution_aware|product_aware|most_aware",
  "brand_visual_code": {
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "accent_color": "#hex",
    "font_style": "style de police dominant (serif, sans-serif, display, etc.)",
    "visual_tone": "description du ton visuel en 3-5 mots (ex: premium minimaliste chaleureux)"
  },
  "format_goal": "Objectif specifique du format (ex: arreter le scroll dans un feed Instagram carre)",
  "constraints": ["contrainte 1 (ex: pas de rouge)", "contrainte 2"],
  "brief_summary": "Resume du brief en 1 phrase si brief fourni, sinon null",
  "product_name": "Nom exact du produit",
  "product_key_benefit": "Le benefice #1 a communiquer visuellement",
  "brand_name": "Nom de la marque",
  "red_lines": ["INTERDIT ABSOLU 1 (ex: ne jamais mentionner les concurrents)", "INTERDIT 2"],
  "brand_combat": "Ce contre quoi la marque lutte (ennemi/combat) si mentionne, sinon null",
  "brand_values": [{"name": "Valeur", "signification": "Ce que ca signifie"}],

  "campaignThesis": "La these de campagne en 1 phrase (ex: 'Le cafe premium ne devrait pas detruire la planete')",
  "lockedPromise": "La promesse unique, formulee pour la pub (ex: 'Un espresso parfait, zero dechet')",
  "lockedProof": "La preuve la plus forte, formulee visuellement (ex: 'Capsule inox reutilisable 10 000 fois')"
}`,
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Context filter: pas de reponse textuelle de Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const parsed = JSON.parse(jsonStr.trim()) as FilteredContext;

    // Ensure new optional fields have defaults
    if (!parsed.red_lines) parsed.red_lines = [];
    if (!parsed.brand_values) parsed.brand_values = [];

    // ═══════════════════════════════════════════════════════════
    // COUCHE 2 — Enrich with Product Analysis
    // ═══════════════════════════════════════════════════════════
    if (input.product?.analysis) {
      const pa = input.product.analysis;

      // FAB Benefits
      if (pa.fabBenefits?.length) {
        parsed.product_fab_benefits = pa.fabBenefits
          .map(fab => `${fab.benefit} (${fab.advantage})`)
          .join(" | ");
      }

      // USP Triptyque
      if (pa.uspTriptyque) {
        parsed.product_usp_triptyque = `USP: ${pa.uspTriptyque.usp} | UMP: ${pa.uspTriptyque.ump} | UMS: ${pa.uspTriptyque.ums}`;
      }

      // Objections
      if (pa.objections?.length) {
        parsed.product_objections = pa.objections
          .slice(0, 3)
          .map(obj => `[${obj.type}] ${obj.objection}`)
          .join(" | ");
      }

      // Value Equation
      if (pa.valueEquation) {
        parsed.product_value_equation = `Dream: ${pa.valueEquation.dreamOutcome} (score ${pa.valueEquation.score.toFixed(1)}/10)`;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // COUCHE 3 — Enrich with Marketing Angle
    // ═══════════════════════════════════════════════════════════
    if (input.marketingAngle) {
      const angle = input.marketingAngle;

      parsed.angle_epic_type = angle.epicType;
      parsed.angle_core_benefit = angle.coreBenefit;

      // Hooks
      if (angle.hooks?.length) {
        parsed.angle_hooks = angle.hooks.map(h => h.text);
      }

      // First narrative
      if (angle.narratives?.length) {
        const narr = angle.narratives[0];
        parsed.angle_narrative = `[${narr.structure}] ${narr.opening} → ${narr.resolution}`;
      }

      // Terrain
      if (angle.terrain) {
        parsed.angle_terrain = `${angle.terrain.awareness}, ${angle.terrain.temperature}, emotion=${angle.terrain.dominantEmotion}`;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // COUCHE 4 — Enrich with Rich Persona
    // ═══════════════════════════════════════════════════════════
    if (input.persona?.richProfile) {
      const rp = input.persona.richProfile;

      // 5-Level Desires
      if (rp.psychographics?.desires?.length) {
        parsed.persona_desires = rp.psychographics.desires
          .map(d => `L${d.level}: ${d.description}`)
          .join(" | ");
      }

      // Situational Triggers
      if (rp.situationalTriggers?.length) {
        parsed.persona_triggers = rp.situationalTriggers
          .slice(0, 3)
          .map(t => `${t.trigger} (${t.emotion})`)
          .join(" | ");
      }

      // Language Profile
      if (rp.languageProfile) {
        const lp = rp.languageProfile;
        const parts: string[] = [];
        if (lp.triggerWords?.length) parts.push(`triggers: ${lp.triggerWords.slice(0, 5).join(", ")}`);
        if (lp.preferredTone?.length) parts.push(`tone: ${lp.preferredTone.join(", ")}`);
        parts.push(`proof: ${lp.socialProofType}`);
        parsed.persona_language_profile = parts.join(" | ");
      }

      // Decision Style
      if (rp.buyingPsychology) {
        parsed.persona_decision_style = `${rp.buyingPsychology.decisionStyle} (risk: ${rp.buyingPsychology.riskTolerance})`;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Extract BatchLockConfig from the merged response
    // ═══════════════════════════════════════════════════════════
    const lock: BatchLockConfig = {
      campaignThesis: (parsed as any).campaignThesis || `${parsed.brand_name} — ${parsed.promise}`,
      lockedPromise: (parsed as any).lockedPromise || parsed.promise,
      lockedProof: (parsed as any).lockedProof || parsed.proof,
    };

    // Clean the lock fields from context (they belong to BatchLockConfig)
    delete (parsed as any).campaignThesis;
    delete (parsed as any).lockedPromise;
    delete (parsed as any).lockedProof;

    console.log("[ContextFilter] Filtered context:", {
      tension: parsed.audience_tension,
      promise: parsed.promise,
      awareness: parsed.awareness_level,
      product: parsed.product_name,
      redLinesCount: parsed.red_lines?.length || 0,
      brandCombat: parsed.brand_combat || null,
      hasProductAnalysis: !!parsed.product_fab_benefits,
      hasAngle: !!parsed.angle_epic_type,
      hasRichPersona: !!parsed.persona_desires,
    });
    console.log("[ContextFilter] Batch lock (merged):", {
      thesis: lock.campaignThesis.slice(0, 60),
      promise: lock.lockedPromise.slice(0, 60),
      proof: lock.lockedProof.slice(0, 60),
    });
    return { context: parsed, lock };
  } catch (e) {
    console.error("[ContextFilter] JSON parse error:", jsonStr.slice(0, 200));
    throw new Error(`Context filter: JSON invalide — ${(e as Error).message}`);
  }
}

function buildRawContextDump(input: RawPipelineInput): string {
  const parts: string[] = [];

  // Brand
  parts.push(`MARQUE: ${input.brand.name}`);
  if (input.brand.description) parts.push(`Description: ${input.brand.description}`);
  if (input.brand.positioning) parts.push(`Positionnement: ${input.brand.positioning}`);
  if (input.brand.tone) parts.push(`Ton: ${input.brand.tone}`);
  if (input.brand.targetMarket) parts.push(`Marche cible: ${input.brand.targetMarket}`);
  if (input.brand.colorPalette) {
    parts.push(`Couleurs: primaire ${input.brand.colorPalette.primary}, secondaire ${input.brand.colorPalette.secondary}, accent ${input.brand.colorPalette.accent}`);
  }
  if (input.brand.typography) {
    parts.push(`Typo: titres ${input.brand.typography.headingFont}, corps ${input.brand.typography.bodyFont}`);
  }

  // V1 Brief: Identite Fondamentale
  if (input.brand.identiteFondamentale) {
    const id = input.brand.identiteFondamentale;
    if (id.vision) parts.push(`Vision: ${id.vision}`);
    if (id.mission) parts.push(`Mission: ${id.mission}`);
    if (id.combatEnnemi) parts.push(`Combat/Ennemi: ${id.combatEnnemi}`);
    if (id.histoireMarque) parts.push(`Histoire: ${id.histoireMarque}`);
    if (id.valeurs?.length) {
      parts.push(`Valeurs: ${id.valeurs.map(v => `${v.name} (${v.signification})`).join(", ")}`);
    }
  }

  // V1 Brief: Positionnement Strategique
  if (input.brand.positionnementStrategique) {
    const pos = input.brand.positionnementStrategique;
    if (pos.propositionValeur) parts.push(`Proposition de valeur: ${pos.propositionValeur}`);
    if (pos.positionnementPrix) {
      parts.push(`Positionnement prix: ${pos.positionnementPrix.niveau}${pos.positionnementPrix.prixMoyen ? ` (~${pos.positionnementPrix.prixMoyen}€)` : ""}`);
    }
    if (pos.elementDistinctif) parts.push(`Element distinctif: ${pos.elementDistinctif}`);
    if (pos.avantagesConcurrentiels?.length) {
      parts.push(`Avantages concurrentiels: ${pos.avantagesConcurrentiels.join(" | ")}`);
    }
  }

  // V1 Brief: Ton & Communication
  if (input.brand.tonCommunication) {
    const ton = input.brand.tonCommunication;
    if (ton.tonDominant?.length) parts.push(`Ton dominant: ${ton.tonDominant.join(", ")}`);
    if (ton.registresEncourages?.length) parts.push(`Registres encourages: ${ton.registresEncourages.join(", ")}`);
    if (ton.registresAEviter?.length) parts.push(`Registres a eviter: ${ton.registresAEviter.join(", ")}`);
    if (ton.vocabulaireRecurrent?.length) parts.push(`Vocabulaire recurrent: ${ton.vocabulaireRecurrent.join(", ")}`);
    if (ton.redLines?.length) {
      parts.push(`\n⛔ RED LINES (INTERDITS ABSOLUS): ${ton.redLines.join(" | ")}`);
    }
  }

  // Product
  if (input.product) {
    parts.push(`\nPRODUIT: ${input.product.name}`);
    if (input.product.category) parts.push(`Categorie: ${input.product.category}`);
    if (input.product.usp) parts.push(`USP: ${input.product.usp}`);
    if (input.product.benefits?.length) parts.push(`Benefices: ${input.product.benefits.join(" | ")}`);
    if (input.product.competitiveAdvantage) parts.push(`Avantage concurrentiel: ${input.product.competitiveAdvantage}`);
    if (input.product.marketingArguments) {
      const ma = input.product.marketingArguments;
      if (ma.headlines?.length) parts.push(`Headlines: ${ma.headlines.join(" | ")}`);
      if (ma.hooks?.length) parts.push(`Hooks: ${ma.hooks.join(" | ")}`);
      if (ma.emotionalTriggers?.length) parts.push(`Triggers: ${ma.emotionalTriggers.join(", ")}`);
      if (ma.socialProof?.length) parts.push(`Preuves: ${ma.socialProof.join(", ")}`);
    }

    // COUCHE 2 — Product Analysis
    if (input.product.analysis) {
      const pa = input.product.analysis;
      parts.push(`\n=== ANALYSE PRODUIT (Couche 2) ===`);

      // FAB Benefits
      if (pa.fabBenefits?.length) {
        parts.push(`FAB BENEFITS:`);
        pa.fabBenefits.slice(0, 3).forEach(fab => {
          parts.push(`  - Feature: ${fab.feature} → Advantage: ${fab.advantage} → Benefit: ${fab.benefit}`);
        });
      }

      // USP Triptyque
      if (pa.uspTriptyque) {
        parts.push(`USP TRIPTYQUE:`);
        parts.push(`  - USP: ${pa.uspTriptyque.usp}`);
        parts.push(`  - UMP: ${pa.uspTriptyque.ump}`);
        parts.push(`  - UMS: ${pa.uspTriptyque.ums}`);
      }

      // DUR Problems
      if (pa.durProblems?.length) {
        parts.push(`PROBLEMES DUR (top 3):`);
        pa.durProblems.slice(0, 3).forEach(dur => {
          parts.push(`  - [Score ${dur.totalScore.toFixed(1)}] ${dur.description}`);
        });
      }

      // Value Equation
      if (pa.valueEquation) {
        parts.push(`VALUE EQUATION: Dream="${pa.valueEquation.dreamOutcome}" | Likelihood=${pa.valueEquation.perceivedLikelihood}/10 | Score=${pa.valueEquation.score.toFixed(1)}`);
      }

      // Top Objections
      if (pa.objections?.length) {
        parts.push(`OBJECTIONS TOP 3:`);
        pa.objections.slice(0, 3).forEach(obj => {
          parts.push(`  - [${obj.type}] ${obj.objection} → ${obj.reponse}`);
        });
      }
    }
  }

  // Persona
  if (input.persona) {
    parts.push(`\nPERSONA: ${input.persona.name}`);
    if (input.persona.description) parts.push(`Description: ${input.persona.description}`);
    if (input.persona.psychographics?.painPoints?.length)
      parts.push(`Douleurs: ${input.persona.psychographics.painPoints.join(", ")}`);
    if (input.persona.psychographics?.motivations?.length)
      parts.push(`Motivations: ${input.persona.psychographics.motivations.join(", ")}`);

    // COUCHE 4 — Rich Persona
    if (input.persona.richProfile) {
      const rp = input.persona.richProfile;
      parts.push(`\n=== PERSONA RICHE (Couche 4) ===`);
      parts.push(`Tagline: "${rp.tagline}"`);

      // 5-Level Desires
      if (rp.psychographics?.desires?.length) {
        parts.push(`DESIRS (5 niveaux):`);
        rp.psychographics.desires.forEach(d => {
          parts.push(`  - Niveau ${d.level}: ${d.description}`);
        });
      }

      // Language Profile
      if (rp.languageProfile) {
        parts.push(`PROFIL LINGUISTIQUE:`);
        if (rp.languageProfile.triggerWords?.length) {
          parts.push(`  - Mots declencheurs: ${rp.languageProfile.triggerWords.join(", ")}`);
        }
        if (rp.languageProfile.avoidWords?.length) {
          parts.push(`  - Mots a eviter: ${rp.languageProfile.avoidWords.join(", ")}`);
        }
        parts.push(`  - Type preuve sociale: ${rp.languageProfile.socialProofType}`);
      }

      // Situational Triggers
      if (rp.situationalTriggers?.length) {
        parts.push(`TRIGGERS SITUATIONNELS:`);
        rp.situationalTriggers.slice(0, 3).forEach(t => {
          parts.push(`  - [${t.bestAngleType}] ${t.situation} → ${t.trigger} (urgence ${t.urgency}/10)`);
        });
      }

      // Buying Psychology
      if (rp.buyingPsychology) {
        parts.push(`PSYCHOLOGIE ACHAT: Style=${rp.buyingPsychology.decisionStyle}, Risk=${rp.buyingPsychology.riskTolerance}`);
      }
    }
  }

  // COUCHE 3 — Marketing Angle
  if (input.marketingAngle) {
    const angle = input.marketingAngle;
    parts.push(`\n=== ANGLE MARKETING SELECTIONNE (Couche 3) ===`);
    parts.push(`Type EPIC: ${angle.epicType.toUpperCase()}`);
    parts.push(`Nom: ${angle.name}`);
    parts.push(`Core Benefit: ${angle.coreBenefit}`);

    // Terrain
    if (angle.terrain) {
      parts.push(`TERRAIN: awareness=${angle.terrain.awareness}, temp=${angle.terrain.temperature}, sophistication=${angle.terrain.sophistication}/5`);
      parts.push(`Emotion dominante: ${angle.terrain.dominantEmotion}`);
      if (angle.terrain.barriers?.length) {
        parts.push(`Barrieres: ${angle.terrain.barriers.join(", ")}`);
      }
    }

    // Hooks
    if (angle.hooks?.length) {
      parts.push(`HOOKS PRE-ECRITS:`);
      angle.hooks.slice(0, 3).forEach(h => {
        parts.push(`  - [${h.type}] "${h.text}" (force ${h.strength}/10)`);
      });
    }

    // First Narrative
    if (angle.narratives?.length) {
      const narr = angle.narratives[0];
      parts.push(`NARRATIVE (${narr.structure}):`);
      parts.push(`  Opening: ${narr.opening}`);
      parts.push(`  Conflict: ${narr.conflict}`);
      parts.push(`  Resolution: ${narr.resolution}`);
      parts.push(`  CTA: ${narr.cta}`);
    }

    // Visual Direction
    if (angle.visualDirection) {
      parts.push(`DIRECTION VISUELLE: mood="${angle.visualDirection.mood}", style="${angle.visualDirection.imageryStyle}"`);
    }
  }

  // Brief
  if (input.brief) parts.push(`\nBRIEF: ${input.brief}`);

  // Format
  parts.push(`\nFORMAT: ${input.format} (${input.aspectRatio})`);

  // Guidelines (already compiled — keep short)
  if (input.guidelinesPrompt) parts.push(`\nGUIDELINES (resume): ${input.guidelinesPrompt.slice(0, 500)}`);

  // Documents
  if (input.documentsPrompt) parts.push(`\nDOCUMENTS MARQUE (resume): ${input.documentsPrompt.slice(0, 500)}`);

  // Inspirations
  if (input.inspirationPrompt) parts.push(`\nINSPIRATIONS ADS (resume): ${input.inspirationPrompt.slice(0, 500)}`);

  return parts.join("\n");
}
