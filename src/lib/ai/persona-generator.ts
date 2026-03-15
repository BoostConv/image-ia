import Anthropic from "@anthropic-ai/sdk";
import { nanoid } from "nanoid";
import { callClaudeWithRetry } from "./claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import type {
  ProductAnalysis,
  IdentiteFondamentale,
  PositionnementStrategique,
  RichPersona,
  DesireLevel,
  DefensePsychology,
  LanguageProfile,
  SituationalTrigger,
  PersonaDemographics,
  PersonaPsychographics,
  DigitalBehavior,
  CustomerJourney,
  AngleAffinity,
  MarketingAngleSpec,
  EPICType,
} from "../db/schema";

// ============================================================
// PERSONA GENERATOR — Couche 4
// Generates rich personas with 5-level desires, psychology,
// and angle affinities using Claude AI
// ============================================================

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante dans .env.local");
  return new Anthropic({ apiKey: key });
};

export interface PersonaGenerationInput {
  brand: {
    name: string;
    identity?: IdentiteFondamentale;
    positioning?: PositionnementStrategique;
    targetMarket?: string;
  };
  product?: {
    name: string;
    category?: string;
    analysis?: ProductAnalysis;
    price?: number;
  };
  existingPersonaHints?: {
    name?: string;
    demographics?: Partial<PersonaDemographics>;
    description?: string;
  };
  angles?: MarketingAngleSpec[];  // Pour calculer affinites
}

interface RawPersonaResponse {
  name: string;
  avatar: string;
  tagline: string;
  demographics: PersonaDemographics;
  psychographics: {
    desires: DesireLevel[];
    fears: string[];
    frustrations: string[];
    aspirations: string[];
    values: string[];
    beliefs: string[];
  };
  buyingPsychology: DefensePsychology;
  languageProfile: LanguageProfile;
  situationalTriggers: SituationalTrigger[];
  digitalBehavior: DigitalBehavior;
  customerJourney: CustomerJourney;
  angleAffinities?: AngleAffinity[];
  fieldConfidences: Record<string, number>;
  gaps: Array<{ field: string; reason: string }>;
}

/**
 * Generate a single rich persona.
 *
 * @param input - Brand, product, and optional hints
 * @returns RichPersona with 5-level desires, psychology, triggers
 */
export async function generateRichPersona(
  input: PersonaGenerationInput
): Promise<RichPersona> {
  const personas = await generatePersonaSet(input, 1);
  return personas[0];
}

/**
 * Generate multiple rich personas.
 *
 * @param input - Brand, product, and optional hints
 * @param count - Number of personas to generate (1-5)
 * @returns Array of RichPersona
 */
export async function generatePersonaSet(
  input: PersonaGenerationInput,
  count: number = 3
): Promise<RichPersona[]> {
  const client = getClient();
  const validCount = Math.max(1, Math.min(5, count));

  const context = buildPersonaContext(input);

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10000,
      system: `Tu es un PSYCHOLOGUE CONSOMMATEUR et STRATEGE PERSONA specialise en e-commerce DTC.

## TA MISSION

Creer des PERSONAS PSYCHOGRAPHIQUES thematiques — PAS des fiches demographiques type "Claire, 38 ans, cadre a Paris".

Chaque persona represente un ARCHETYPE COMPORTEMENTAL identifie par un theme descriptif (ex: "Le Sportif du dimanche", "L'Eco-consciente exigeante", "Le Biohacker impatient").

## PHILOSOPHIE

On ne cible PAS un age ou un genre — on cible une PSYCHOLOGIE, un RAPPORT AU MONDE, un PATTERN COMPORTEMENTAL.
Deux personnes de 25 et 55 ans peuvent etre "Le Perfectionniste anxieux" — ce qui compte c'est leur facon de penser, decider, resister.

## STRUCTURE DU PERSONA

### 1. IDENTITE THEMATIQUE
- **name**: Theme descriptif (ex: "Le Sportif du dimanche", "L'Optimiseur obsessionnel", "La Pragmatique no-bullshit")
  → PAS de prenom, PAS d'age dans le nom
- **avatar**: Description visuelle d'une SCENE ou AMBIANCE representant ce persona (pas un portrait type)
  Ex: "Bureau minimaliste avec un planning nutrition affiche, shaker proteine, laptop ouvert sur un comparatif"
- **tagline**: "[Archetype] qui [tension centrale]"
  Ex: "L'optimiseur qui veut le meilleur ROI de chaque achat sante"

### 2. DEMOGRAPHIE LARGE
- **ageRange**: large (ex: "25-45", "30-55") — c'est un RANGE, pas une fiche
- Les autres champs (genre, location, income, profession, familyStatus, education) restent utiles mais doivent etre LARGES et INCLUSIFS
  Ex: gender = "Mixte, legere surrepresentation masculine" plutot que "Homme"

### 3. PSYCHOGRAPHIE A 5 NIVEAUX DE DESIRS

C'est LA partie la plus importante. 5 niveaux de profondeur:

- **Niveau 1 (Surface)**: Ce qu'ils DISENT vouloir
  Ex: "Je veux un snack proteine pratique"

- **Niveau 2 (Fonctionnel)**: Ce qu'ils VEULENT VRAIMENT
  Ex: "Je veux optimiser ma nutrition sans y passer des heures"

- **Niveau 3 (Emotionnel)**: Comment ils veulent SE SENTIR
  Ex: "Je veux sentir que je fais les choses correctement"

- **Niveau 4 (Identitaire)**: QUI ils veulent DEVENIR
  Ex: "Je veux etre quelqu'un de discipline et d'informe"

- **Niveau 5 (Existentiel)**: Le SENS PROFOND recherche
  Ex: "Je veux prouver que ma rigueur produit des resultats superieurs"

### 4. PSYCHOLOGIE D'ACHAT
- **primaryDefense**: Mecanisme de defense dominant (rationalisation, deni, projection, etc.)
- **resistancePatterns**: Patterns de resistance a l'achat
- **trustBuilders**: Ce qui construit la confiance
- **decisionStyle**: impulsif | analytique | social | emotionnel
- **riskTolerance**: faible | modere | eleve

### 5. PROFIL LINGUISTIQUE
- **vocabularyLevel**: simple | intermediaire | sophistique
- **preferredTone**: Tons preferes
- **triggerWords**: Mots qui captent l'attention DE CET ARCHETYPE
- **avoidWords**: Mots qui repoussent CET ARCHETYPE
- **metaphorsResonant**: Metaphores qui parlent A CET ARCHETYPE
- **socialProofType**: experts | pairs | celebrities | statistics

### 6. TRIGGERS SITUATIONNELS (3-5)
Moments de vie declencheurs specifiques a cet archetype avec:
- situation, trigger, emotion, urgency (1-10), bestAngleType (EPIC)

### 7. COMPORTEMENT DIGITAL
Plateformes, preferences contenu, horaires, device, attention span

### 8. PARCOURS CLIENT
Canaux de decouverte, comportement recherche, facteurs decision, post-achat

### 9. AFFINITES ANGLES (si angles fournis)
Score d'affinite (1-10) avec raison pour chaque angle

## REGLES ABSOLUES

- Le nom est TOUJOURS un archetype thematique ("Le/La [Theme]"), JAMAIS un prenom
- PAS de fiche signaletique type "Marie, 34 ans, mariee, 2 enfants" — c'est un PROFIL PSYCHO
- Les desirs niveau 5 doivent etre EXISTENTIELS et propres a l'archetype
- Les triggers doivent etre des MOMENTS DE VIE reels et specifiques a l'archetype
- Les beliefs incluent croyances LIMITANTES et HABILITANTES
- Chaque persona = RADICALEMENT different en PSYCHOLOGIE (pas juste en age/genre)
- La demographie sert de CONTEXTE, pas de DEFINITION — c'est le profil psycho qui prime

Reponds UNIQUEMENT en JSON valide (array de ${validCount} personas), sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Genere ${validCount} persona(s) psychographique(s) thematique(s).

IMPORTANT: Reponds UNIQUEMENT en JSON valide. Pas d'apostrophes typographiques, pas de caracteres speciaux. Utilise des apostrophes simples (') dans le texte, pas des guillemets.

${context}

=== FORMAT JSON ATTENDU (array de ${validCount} objets) ===

Chaque objet doit avoir EXACTEMENT cette structure:

{
  "name": "L'Optimiseur sante",
  "avatar": "Scene representant l'univers mental du persona",
  "tagline": "L'archetype qui [tension]",
  "demographics": {
    "ageRange": "25-45",
    "gender": "Mixte",
    "location": "Urbain",
    "income": "40-80k",
    "profession": "...",
    "familyStatus": "Variable",
    "education": "..."
  },
  "psychographics": {
    "desires": [
      {"level": 1, "description": "Desir surface"},
      {"level": 2, "description": "Desir fonctionnel"},
      {"level": 3, "description": "Desir emotionnel"},
      {"level": 4, "description": "Desir identitaire"},
      {"level": 5, "description": "Desir existentiel"}
    ],
    "fears": ["..."],
    "frustrations": ["..."],
    "aspirations": ["..."],
    "values": ["..."],
    "beliefs": ["... (limitante)", "... (habilitante)"]
  },
  "buyingPsychology": {
    "primaryDefense": "...",
    "resistancePatterns": ["..."],
    "trustBuilders": ["..."],
    "decisionStyle": "analytique|impulsif|social|emotionnel",
    "riskTolerance": "faible|modere|eleve"
  },
  "languageProfile": {
    "vocabularyLevel": "simple|intermediaire|sophistique",
    "preferredTone": ["..."],
    "triggerWords": ["..."],
    "avoidWords": ["..."],
    "metaphorsResonant": ["..."],
    "socialProofType": "experts|pairs|celebrities|statistics"
  },
  "situationalTriggers": [
    {"situation": "...", "trigger": "...", "emotion": "...", "urgency": 7, "bestAngleType": "practical|emotional|identity|critical"}
  ],
  "digitalBehavior": {
    "platforms": ["..."],
    "contentPreferences": ["..."],
    "peakActivityTimes": ["..."],
    "devicePreference": "mobile|desktop|tablet",
    "attentionSpan": "court|moyen|long"
  },
  "customerJourney": {
    "awarenessChannels": ["..."],
    "researchBehavior": "...",
    "decisionFactors": ["..."],
    "postPurchaseBehavior": "..."
  },
  "angleAffinities": [],
  "fieldConfidences": {"demographics": 0.8, "desires": 0.9, "triggers": 0.85},
  "gaps": []
}

Remplis CHAQUE champ avec du contenu riche et specifique a l'archetype. 3-5 items par array. Desirs = 5 niveaux obligatoires. Triggers = 2-4.`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Persona Generator: pas de reponse textuelle de Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const rawPersonas = JSON.parse(jsonStr.trim()) as RawPersonaResponse[];

    const personas = rawPersonas.map((raw) => validateAndEnrichPersona(raw, input.angles));

    console.log("[PersonaGenerator] Generated personas:", {
      count: personas.length,
      names: personas.map((p) => p.name),
    });

    return personas;
  } catch (e) {
    const err = e as Error;
    // Log context around the error position for debugging
    const posMatch = err.message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      console.error("[PersonaGenerator] JSON error at position", pos);
      console.error("[PersonaGenerator] Context:", JSON.stringify(jsonStr.slice(Math.max(0, pos - 80), pos + 80)));
    } else {
      console.error("[PersonaGenerator] JSON parse error:", jsonStr.slice(0, 500));
    }
    throw new Error(`Persona Generator: JSON invalide — ${err.message}`);
  }
}

// ============================================================
// CONTEXT BUILDER
// ============================================================

function buildPersonaContext(input: PersonaGenerationInput): string {
  const parts: string[] = [];

  // Brand
  parts.push(`=== MARQUE: ${input.brand.name} ===`);

  if (input.brand.identity) {
    const id = input.brand.identity;
    if (id.mission) parts.push(`Mission: ${id.mission}`);
    if (id.combatEnnemi) parts.push(`Combat: ${id.combatEnnemi}`);
    if (id.valeurs?.length) {
      parts.push(`Valeurs: ${id.valeurs.map((v) => `${v.name} (${v.signification})`).join(", ")}`);
    }
  }

  if (input.brand.positioning) {
    const pos = input.brand.positioning;
    if (pos.propositionValeur) parts.push(`Proposition: ${pos.propositionValeur}`);
    if (pos.positionnementPrix) {
      parts.push(`Prix: ${pos.positionnementPrix.niveau}`);
    }
  }

  if (input.brand.targetMarket) {
    parts.push(`Marche cible: ${input.brand.targetMarket}`);
  }

  // Product
  if (input.product) {
    parts.push(`\n=== PRODUIT: ${input.product.name} ===`);
    if (input.product.category) parts.push(`Categorie: ${input.product.category}`);
    if (input.product.price) parts.push(`Prix: ${input.product.price} EUR`);

    if (input.product.analysis) {
      const pa = input.product.analysis;

      if (pa.fabBenefits?.length) {
        parts.push(`\nBenefices cles:`);
        pa.fabBenefits.slice(0, 3).forEach((fab) => {
          parts.push(`- ${fab.benefit}`);
        });
      }

      if (pa.durProblems?.length) {
        parts.push(`\nProblemes resolus:`);
        pa.durProblems.slice(0, 3).forEach((dur) => {
          parts.push(`- ${dur.description}`);
        });
      }

      if (pa.reviewInsights) {
        if (pa.reviewInsights.emotionalQuotes?.length) {
          parts.push(`\nCitations clients:`);
          pa.reviewInsights.emotionalQuotes.slice(0, 3).forEach((q) => {
            parts.push(`- "${q}"`);
          });
        }
      }
    }
  }

  // Existing persona hints
  if (input.existingPersonaHints) {
    parts.push(`\n=== INDICATIONS PERSONA ===`);
    if (input.existingPersonaHints.name) {
      parts.push(`Nom suggere: ${input.existingPersonaHints.name}`);
    }
    if (input.existingPersonaHints.description) {
      parts.push(`Description: ${input.existingPersonaHints.description}`);
    }
    if (input.existingPersonaHints.demographics) {
      const d = input.existingPersonaHints.demographics;
      if (d.ageRange) parts.push(`Age: ${d.ageRange}`);
      if (d.gender) parts.push(`Genre: ${d.gender}`);
      if (d.location) parts.push(`Localisation: ${d.location}`);
    }
  }

  // Angles (for affinity calculation)
  if (input.angles?.length) {
    parts.push(`\n=== ANGLES MARKETING (pour affinites) ===`);
    input.angles.forEach((a) => {
      parts.push(`- [${a.id}] ${a.name} (${a.epicType}): ${a.coreBenefit}`);
    });
  }

  return parts.join("\n");
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateAndEnrichPersona(
  raw: RawPersonaResponse,
  angles?: MarketingAngleSpec[]
): RichPersona {
  const id = `persona_${nanoid(8)}`;

  // Calculate average confidence
  const confidenceValues = Object.values(raw.fieldConfidences || {});
  const avgConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0.7;

  return {
    id,
    name: raw.name || "Persona",
    avatar: raw.avatar || "",
    tagline: raw.tagline || "",
    demographics: validateDemographics(raw.demographics),
    psychographics: validatePsychographics(raw.psychographics),
    buyingPsychology: validateBuyingPsychology(raw.buyingPsychology),
    languageProfile: validateLanguageProfile(raw.languageProfile),
    situationalTriggers: validateSituationalTriggers(raw.situationalTriggers),
    digitalBehavior: validateDigitalBehavior(raw.digitalBehavior),
    customerJourney: validateCustomerJourney(raw.customerJourney),
    angleAffinities: validateAngleAffinities(raw.angleAffinities, angles),
    metadata: {
      generatedAt: new Date().toISOString(),
      basedOn: ["brand_context", "product_analysis"],
      confidence: avgConfidence,
      gaps: raw.gaps || [],
    },
  };
}

function validateDemographics(input: PersonaDemographics): PersonaDemographics {
  return {
    ageRange: input?.ageRange || "25-45",
    gender: input?.gender || "",
    location: input?.location || "",
    income: input?.income || "",
    profession: input?.profession || "",
    familyStatus: input?.familyStatus || "",
    education: input?.education || "",
  };
}

function validatePsychographics(input: RawPersonaResponse["psychographics"]): PersonaPsychographics {
  return {
    desires: validateDesires(input?.desires),
    fears: Array.isArray(input?.fears) ? input.fears : [],
    frustrations: Array.isArray(input?.frustrations) ? input.frustrations : [],
    aspirations: Array.isArray(input?.aspirations) ? input.aspirations : [],
    values: Array.isArray(input?.values) ? input.values : [],
    beliefs: Array.isArray(input?.beliefs) ? input.beliefs : [],
  };
}

function validateDesires(input: DesireLevel[]): DesireLevel[] {
  if (!Array.isArray(input)) return [];

  const validLevels = [1, 2, 3, 4, 5] as const;

  // Ensure all 5 levels exist
  const desires: DesireLevel[] = [];
  for (const level of validLevels) {
    const existing = input.find((d) => d.level === level);
    desires.push({
      level,
      description: existing?.description || `Desir niveau ${level}`,
    });
  }

  return desires;
}

function validateBuyingPsychology(input: DefensePsychology): DefensePsychology {
  const validDecisionStyles = ["impulsif", "analytique", "social", "emotionnel"] as const;
  const validRiskTolerance = ["faible", "modere", "eleve"] as const;

  return {
    primaryDefense: input?.primaryDefense || "",
    resistancePatterns: Array.isArray(input?.resistancePatterns) ? input.resistancePatterns : [],
    trustBuilders: Array.isArray(input?.trustBuilders) ? input.trustBuilders : [],
    decisionStyle: validDecisionStyles.includes(input?.decisionStyle as typeof validDecisionStyles[number])
      ? input.decisionStyle
      : "emotionnel",
    riskTolerance: validRiskTolerance.includes(input?.riskTolerance as typeof validRiskTolerance[number])
      ? input.riskTolerance
      : "modere",
  };
}

function validateLanguageProfile(input: LanguageProfile): LanguageProfile {
  const validVocabLevels = ["simple", "intermediaire", "sophistique"] as const;
  const validProofTypes = ["experts", "pairs", "celebrities", "statistics"] as const;

  return {
    vocabularyLevel: validVocabLevels.includes(input?.vocabularyLevel as typeof validVocabLevels[number])
      ? input.vocabularyLevel
      : "intermediaire",
    preferredTone: Array.isArray(input?.preferredTone) ? input.preferredTone : [],
    triggerWords: Array.isArray(input?.triggerWords) ? input.triggerWords : [],
    avoidWords: Array.isArray(input?.avoidWords) ? input.avoidWords : [],
    metaphorsResonant: Array.isArray(input?.metaphorsResonant) ? input.metaphorsResonant : [],
    socialProofType: validProofTypes.includes(input?.socialProofType as typeof validProofTypes[number])
      ? input.socialProofType
      : "pairs",
  };
}

function validateSituationalTriggers(input: SituationalTrigger[]): SituationalTrigger[] {
  if (!Array.isArray(input)) return [];

  const validEpicTypes: EPICType[] = ["emotional", "practical", "identity", "critical"];

  return input.map((trigger) => ({
    situation: trigger.situation || "",
    trigger: trigger.trigger || "",
    emotion: trigger.emotion || "",
    urgency: clampScore(trigger.urgency),
    bestAngleType: validEpicTypes.includes(trigger.bestAngleType)
      ? trigger.bestAngleType
      : "practical",
  }));
}

function validateDigitalBehavior(input: DigitalBehavior): DigitalBehavior {
  const validDevices = ["mobile", "desktop", "tablet"] as const;
  const validAttention = ["court", "moyen", "long"] as const;

  return {
    platforms: Array.isArray(input?.platforms) ? input.platforms : [],
    contentPreferences: Array.isArray(input?.contentPreferences) ? input.contentPreferences : [],
    peakActivityTimes: Array.isArray(input?.peakActivityTimes) ? input.peakActivityTimes : [],
    devicePreference: validDevices.includes(input?.devicePreference as typeof validDevices[number])
      ? input.devicePreference
      : "mobile",
    attentionSpan: validAttention.includes(input?.attentionSpan as typeof validAttention[number])
      ? input.attentionSpan
      : "court",
  };
}

function validateCustomerJourney(input: CustomerJourney): CustomerJourney {
  return {
    awarenessChannels: Array.isArray(input?.awarenessChannels) ? input.awarenessChannels : [],
    researchBehavior: input?.researchBehavior || "",
    decisionFactors: Array.isArray(input?.decisionFactors) ? input.decisionFactors : [],
    postPurchaseBehavior: input?.postPurchaseBehavior || "",
  };
}

function validateAngleAffinities(
  input: AngleAffinity[] | undefined,
  angles?: MarketingAngleSpec[]
): AngleAffinity[] {
  if (!Array.isArray(input)) return [];
  if (!angles?.length) return [];

  const angleIds = angles.map((a) => a.id);

  return input
    .filter((aff) => angleIds.includes(aff.angleId))
    .map((aff) => ({
      angleId: aff.angleId,
      affinityScore: clampScore(aff.affinityScore),
      reason: aff.reason || "",
    }));
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}
