import Anthropic from "@anthropic-ai/sdk";
import { nanoid } from "nanoid";
import { callClaudeWithRetry } from "./claude-retry";
import type {
  ProductAnalysis,
  IdentiteFondamentale,
  PositionnementStrategique,
  TonCommunication,
  RichPersona,
  MarketingAngleSpec,
  AnglesPrioritization,
  EPICType,
  TerrainAnalysis,
  MarketingHook,
  Narrative,
  VisualDirectionSpec,
  EstimatedPerformance,
  AnglePriority,
  AngleSynergy,
} from "../db/schema";

// ============================================================
// MARKETING ANGLES GENERATOR — Couche 3 (Framework EPIC)
// Generates structured marketing angles with terrain, hooks,
// and narratives using Claude AI
// ============================================================

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante dans .env.local");
  return new Anthropic({ apiKey: key });
};

export interface AnglesGenerationInput {
  brand: {
    name: string;
    identity?: IdentiteFondamentale;
    positioning?: PositionnementStrategique;
    tone?: TonCommunication;
  };
  product: {
    id: string;
    name: string;
    price?: number;
    analysis?: ProductAnalysis;
    category?: string;
  };
  personas?: RichPersona[];
  competitorAngles?: string[];  // Angles concurrents a eviter/differencier
}

interface RawAngleResponse {
  id: string;
  name: string;
  epicType: EPICType;
  terrain: TerrainAnalysis;
  coreBenefit: string;
  targetPersonaIds: string[];
  hooks: MarketingHook[];
  narratives: Narrative[];
  visualDirection: VisualDirectionSpec;
  estimatedPerformance: EstimatedPerformance;
}

interface RawAnglesResponse {
  angles: RawAngleResponse[];
  priorityMatrix: AnglePriority[];
  synergies: AngleSynergy[];
  fieldConfidences: Record<string, number>;
}

/**
 * Generate marketing angles using the EPIC framework.
 *
 * @param input - Brand, product, and persona context
 * @returns AnglesPrioritization with 4+ angles (one per EPIC type)
 */
export async function generateMarketingAngles(
  input: AnglesGenerationInput
): Promise<AnglesPrioritization> {
  const client = getClient();

  const context = buildAnglesContext(input);

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: `Tu es un DIRECTEUR DE CREATION PUBLICITAIRE specialise DTC/e-commerce.

## TA MISSION

Generer des ANGLES MARKETING structures selon le framework EPIC, avec terrain, hooks et narratives.

## FRAMEWORK EPIC

- **EMOTIONAL**: Angles bases sur transformation emotionnelle, aspirations, feelings
- **PRACTICAL**: Angles bases sur benefices concrets, ROI, efficacite, fonctionnalites
- **IDENTITY**: Angles bases sur appartenance, statut, valeurs, "qui je suis"
- **CRITICAL**: Angles bases sur urgence, peur de manquer, probleme non resolu

## POUR CHAQUE ANGLE

### 1. TERRAIN ANALYSIS
- **awareness**: unaware | problem_aware | solution_aware | product_aware | most_aware
- **sophistication**: 1-5 (1 = marche naif, 5 = marche sature)
- **temperature**: cold | warm | hot
- **dominantEmotion**: L'emotion cle a exploiter
- **barriers**: Les freins a l'achat

### 2. HOOKS (3 par angle)
Types: question | statement | story | statistic | challenge
Chaque hook avec targetEmotion et strength (1-10)

### 3. NARRATIVES (2 par angle)
Structures: PAS | AIDA | BAB | 4Ps | StoryBrand
Chaque narrative avec opening, conflict, resolution, cta, fullScript

### 4. VISUAL DIRECTION
- mood: L'atmosphere generale
- colorTone: Palette suggeree
- imageryStyle: Style d'image
- modelDirection: Direction pour les modeles/personnages

### 5. ESTIMATED PERFORMANCE
- engagementScore: 1-10
- conversionPotential: 1-10
- fatigueRisk: 1-10 (risque de lassitude)

## PRIORITISATION

Apres avoir genere les angles:
1. Assigner une priorite (high/medium/low) a chaque angle
2. Suggerer un budget % (total = 100%)
3. Identifier les synergies entre angles

## REGLES

- MINIMUM 4 angles (1 par type EPIC)
- Chaque angle = RADICALEMENT different
- Les hooks doivent etre SPECIFIQUES au produit
- Les narratives doivent etre ACTIONABLES
- Lier chaque angle aux personas si fournis

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Genere les angles marketing EPIC.

${context}

=== FORMAT JSON ATTENDU ===

{
  "angles": [
    {
      "id": "angle_1",
      "name": "Nom descriptif de l'angle",
      "epicType": "emotional|practical|identity|critical",
      "terrain": {
        "awareness": "problem_aware",
        "sophistication": 3,
        "temperature": "warm",
        "dominantEmotion": "Frustration",
        "barriers": ["Prix percu eleve", "Doute sur efficacite"]
      },
      "coreBenefit": "Le benefice central de cet angle",
      "targetPersonaIds": ["persona_id_1"],
      "hooks": [
        {
          "text": "Le hook complet",
          "type": "question",
          "targetEmotion": "curiosite",
          "strength": 8
        }
      ],
      "narratives": [
        {
          "structure": "PAS",
          "opening": "Le probleme",
          "conflict": "L'aggravation",
          "resolution": "La solution",
          "cta": "L'appel a l'action",
          "fullScript": "Le script complet en 3-4 phrases"
        }
      ],
      "visualDirection": {
        "mood": "Atmosphere visuelle",
        "colorTone": "Tons chauds et naturels",
        "imageryStyle": "Lifestyle authentique",
        "modelDirection": "Femme 30-40ans, naturelle, souriante"
      },
      "estimatedPerformance": {
        "engagementScore": 8,
        "conversionPotential": 7,
        "fatigueRisk": 4
      }
    }
  ],
  "priorityMatrix": [
    {
      "angleId": "angle_1",
      "priority": "high",
      "reason": "Fort potentiel de conversion, audience principale",
      "suggestedBudgetPercent": 35
    }
  ],
  "synergies": [
    {
      "angleIds": ["angle_1", "angle_2"],
      "synergyType": "complementaire",
      "recommendation": "Utiliser angle_1 en acquisition, angle_2 en retargeting"
    }
  ],
  "fieldConfidences": {
    "angles": 0.85,
    "hooks": 0.9,
    "narratives": 0.8
  }
}`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Marketing Angles Generator: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const raw = JSON.parse(jsonStr.trim()) as RawAnglesResponse;

    // Validate and enrich angles
    const angles = validateAngles(raw.angles, input.personas);

    // Ensure all EPIC types are covered
    const coveredTypes = new Set(angles.map((a) => a.epicType));
    const missingTypes: EPICType[] = (["emotional", "practical", "identity", "critical"] as EPICType[])
      .filter((t) => !coveredTypes.has(t));

    if (missingTypes.length > 0) {
      console.warn("[AnglesGenerator] Missing EPIC types:", missingTypes);
    }

    const prioritization: AnglesPrioritization = {
      productId: input.product.id,
      angles,
      priorityMatrix: validatePriorityMatrix(raw.priorityMatrix, angles),
      synergies: validateSynergies(raw.synergies, angles),
    };

    console.log("[AnglesGenerator] Generated angles:", {
      productName: input.product.name,
      anglesCount: angles.length,
      epicTypes: Array.from(coveredTypes),
      highPriority: prioritization.priorityMatrix.filter((p) => p.priority === "high").length,
    });

    return prioritization;
  } catch (e) {
    console.error("[AnglesGenerator] JSON parse error:", jsonStr.slice(0, 400));
    throw new Error(`Marketing Angles Generator: JSON invalide — ${(e as Error).message}`);
  }
}

// ============================================================
// CONTEXT BUILDER
// ============================================================

function buildAnglesContext(input: AnglesGenerationInput): string {
  const parts: string[] = [];

  // Brand
  parts.push(`=== MARQUE: ${input.brand.name} ===`);

  if (input.brand.identity) {
    const id = input.brand.identity;
    if (id.vision) parts.push(`Vision: ${id.vision}`);
    if (id.mission) parts.push(`Mission: ${id.mission}`);
    if (id.combatEnnemi) parts.push(`Combat: ${id.combatEnnemi}`);
    if (id.valeurs?.length) {
      parts.push(`Valeurs: ${id.valeurs.map((v) => v.name).join(", ")}`);
    }
  }

  if (input.brand.positioning) {
    const pos = input.brand.positioning;
    if (pos.propositionValeur) parts.push(`Proposition: ${pos.propositionValeur}`);
    if (pos.elementDistinctif) parts.push(`Distinctif: ${pos.elementDistinctif}`);
  }

  if (input.brand.tone) {
    const ton = input.brand.tone;
    if (ton.tonDominant?.length) parts.push(`Ton: ${ton.tonDominant.join(", ")}`);
  }

  // Product
  parts.push(`\n=== PRODUIT: ${input.product.name} ===`);
  if (input.product.price) parts.push(`Prix: ${input.product.price}EUR`);
  if (input.product.category) parts.push(`Categorie: ${input.product.category}`);

  // Product Analysis (from Couche 2)
  if (input.product.analysis) {
    const pa = input.product.analysis;

    if (pa.uspTriptyque) {
      parts.push(`\nUSP Triptyque:`);
      parts.push(`- USP: ${pa.uspTriptyque.usp}`);
      parts.push(`- UMP: ${pa.uspTriptyque.ump}`);
      parts.push(`- UMS: ${pa.uspTriptyque.ums}`);
    }

    if (pa.fabBenefits?.length) {
      parts.push(`\nBenefices (FAB):`);
      pa.fabBenefits.slice(0, 3).forEach((fab) => {
        parts.push(`- ${fab.benefit} (${fab.advantage})`);
      });
    }

    if (pa.durProblems?.length) {
      parts.push(`\nProblemes DUR (score):`);
      pa.durProblems.slice(0, 3).forEach((dur) => {
        parts.push(`- ${dur.description} (${dur.totalScore.toFixed(1)})`);
      });
    }

    if (pa.objections?.length) {
      parts.push(`\nObjections principales:`);
      pa.objections.slice(0, 4).forEach((obj) => {
        parts.push(`- [${obj.type}] ${obj.objection}`);
      });
    }

    if (pa.reviewInsights?.topPraises?.length) {
      parts.push(`\nTop praises clients: ${pa.reviewInsights.topPraises.slice(0, 3).join(" | ")}`);
    }
  }

  // Personas
  if (input.personas?.length) {
    parts.push(`\n=== PERSONAS (${input.personas.length}) ===`);
    input.personas.forEach((p) => {
      parts.push(`\n[${p.id}] ${p.name} — ${p.tagline}`);
      if (p.demographics) {
        parts.push(`  Age: ${p.demographics.ageRange}, ${p.demographics.gender || ""}`);
      }
      if (p.psychographics?.desires?.length) {
        const d5 = p.psychographics.desires.find((d) => d.level === 5);
        if (d5) parts.push(`  Desir profond: ${d5.description}`);
      }
      if (p.situationalTriggers?.length) {
        parts.push(`  Triggers: ${p.situationalTriggers.map((t) => t.trigger).join(", ")}`);
      }
    });
  }

  // Competitor angles to avoid
  if (input.competitorAngles?.length) {
    parts.push(`\n=== ANGLES CONCURRENTS (a eviter/differencier) ===`);
    input.competitorAngles.forEach((a) => parts.push(`- ${a}`));
  }

  return parts.join("\n");
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateAngles(
  input: RawAngleResponse[],
  personas?: RichPersona[]
): MarketingAngleSpec[] {
  if (!Array.isArray(input)) return [];

  const validEpicTypes: EPICType[] = ["emotional", "practical", "identity", "critical"];
  const personaIds = personas?.map((p) => p.id) || [];

  return input.map((angle, index) => {
    const id = angle.id || `angle_${nanoid(8)}`;

    return {
      id,
      name: angle.name || `Angle ${index + 1}`,
      epicType: validEpicTypes.includes(angle.epicType) ? angle.epicType : "practical",
      terrain: validateTerrain(angle.terrain),
      coreBenefit: angle.coreBenefit || "",
      targetPersonaIds: Array.isArray(angle.targetPersonaIds)
        ? angle.targetPersonaIds.filter((pid) => personaIds.length === 0 || personaIds.includes(pid))
        : [],
      hooks: validateHooks(angle.hooks),
      narratives: validateNarratives(angle.narratives),
      visualDirection: validateVisualDirection(angle.visualDirection),
      estimatedPerformance: validatePerformance(angle.estimatedPerformance),
      metadata: {
        generatedAt: new Date().toISOString(),
        basedOn: ["product_analysis", "brand_context"],
        confidence: 0.8,
      },
    };
  });
}

function validateTerrain(input: TerrainAnalysis): TerrainAnalysis {
  const validAwareness = ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"] as const;
  const validTemperature = ["cold", "warm", "hot"] as const;

  return {
    awareness: validAwareness.includes(input?.awareness as typeof validAwareness[number])
      ? input.awareness
      : "problem_aware",
    sophistication: Math.max(1, Math.min(5, input?.sophistication || 3)) as 1 | 2 | 3 | 4 | 5,
    temperature: validTemperature.includes(input?.temperature as typeof validTemperature[number])
      ? input.temperature
      : "warm",
    dominantEmotion: input?.dominantEmotion || "curiosite",
    barriers: Array.isArray(input?.barriers) ? input.barriers : [],
  };
}

function validateHooks(input: MarketingHook[]): MarketingHook[] {
  if (!Array.isArray(input)) return [];

  const validTypes = ["question", "statement", "story", "statistic", "challenge"] as const;

  return input.map((hook) => ({
    text: hook.text || "",
    type: validTypes.includes(hook.type as typeof validTypes[number]) ? hook.type : "statement",
    targetEmotion: hook.targetEmotion || "curiosite",
    strength: clampScore(hook.strength),
  }));
}

function validateNarratives(input: Narrative[]): Narrative[] {
  if (!Array.isArray(input)) return [];

  const validStructures = ["PAS", "AIDA", "BAB", "4Ps", "StoryBrand"] as const;

  return input.map((narr) => ({
    structure: validStructures.includes(narr.structure as typeof validStructures[number])
      ? narr.structure
      : "PAS",
    opening: narr.opening || "",
    conflict: narr.conflict || "",
    resolution: narr.resolution || "",
    cta: narr.cta || "",
    fullScript: narr.fullScript || "",
  }));
}

function validateVisualDirection(input: VisualDirectionSpec): VisualDirectionSpec {
  return {
    mood: input?.mood || "",
    colorTone: input?.colorTone || "",
    imageryStyle: input?.imageryStyle || "",
    modelDirection: input?.modelDirection || "",
  };
}

function validatePerformance(input: EstimatedPerformance): EstimatedPerformance {
  return {
    engagementScore: clampScore(input?.engagementScore || 5),
    conversionPotential: clampScore(input?.conversionPotential || 5),
    fatigueRisk: clampScore(input?.fatigueRisk || 5),
  };
}

function validatePriorityMatrix(
  input: AnglePriority[],
  angles: MarketingAngleSpec[]
): AnglePriority[] {
  if (!Array.isArray(input)) return [];

  const angleIds = angles.map((a) => a.id);
  const validPriorities = ["high", "medium", "low"] as const;

  return input
    .filter((p) => angleIds.includes(p.angleId))
    .map((p) => ({
      angleId: p.angleId,
      priority: validPriorities.includes(p.priority as typeof validPriorities[number])
        ? p.priority
        : "medium",
      reason: p.reason || "",
      suggestedBudgetPercent: Math.max(0, Math.min(100, p.suggestedBudgetPercent || 25)),
    }));
}

function validateSynergies(
  input: AngleSynergy[],
  angles: MarketingAngleSpec[]
): AngleSynergy[] {
  if (!Array.isArray(input)) return [];

  const angleIds = angles.map((a) => a.id);

  return input
    .filter(
      (s) =>
        Array.isArray(s.angleIds) &&
        s.angleIds.length === 2 &&
        angleIds.includes(s.angleIds[0]) &&
        angleIds.includes(s.angleIds[1])
    )
    .map((s) => ({
      angleIds: s.angleIds as [string, string],
      synergyType: s.synergyType || "",
      recommendation: s.recommendation || "",
    }));
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}
