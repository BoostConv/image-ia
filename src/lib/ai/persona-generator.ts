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

Creer des PERSONAS RICHES avec une profondeur psychologique permettant de creer des publicites qui resonnent profondement.

## STRUCTURE DU PERSONA

### 1. IDENTITE
- **name**: Prenom + description courte (ex: "Marie, 34 ans")
- **avatar**: Description visuelle detaillee pour generer une image
- **tagline**: "Le/La [role] qui [tension/desir]" (ex: "La mere active qui culpabilise de ne pas cuisiner maison")

### 2. DEMOGRAPHIE COMPLETE
Tous les champs: age, genre, localisation, revenu, profession, statut familial, education

### 3. PSYCHOGRAPHIE A 5 NIVEAUX DE DESIRS

C'est LA partie la plus importante. 5 niveaux de profondeur:

- **Niveau 1 (Surface)**: Ce qu'ils DISENT vouloir
  Ex: "Je veux des snacks sains pour mes enfants"

- **Niveau 2 (Fonctionnel)**: Ce qu'ils VEULENT VRAIMENT
  Ex: "Je veux que mes enfants mangent mieux sans bataille"

- **Niveau 3 (Emotionnel)**: Comment ils veulent SE SENTIR
  Ex: "Je veux me sentir comme une bonne mere"

- **Niveau 4 (Identitaire)**: QUI ils veulent DEVENIR
  Ex: "Je veux etre la mere qui donne le meilleur a ses enfants"

- **Niveau 5 (Existentiel)**: Le SENS PROFOND recherche
  Ex: "Je veux que mes enfants sachent que je les aime"

### 4. PSYCHOLOGIE D'ACHAT
- **primaryDefense**: Mecanisme de defense dominant (rationalisation, deni, projection, etc.)
- **resistancePatterns**: Patterns de resistance a l'achat
- **trustBuilders**: Ce qui construit la confiance
- **decisionStyle**: impulsif | analytique | social | emotionnel
- **riskTolerance**: faible | modere | eleve

### 5. PROFIL LINGUISTIQUE
- **vocabularyLevel**: simple | intermediaire | sophistique
- **preferredTone**: Tons preferes
- **triggerWords**: Mots qui captent l'attention
- **avoidWords**: Mots qui repoussent
- **metaphorsResonant**: Metaphores qui parlent
- **socialProofType**: experts | pairs | celebrities | statistics

### 6. TRIGGERS SITUATIONNELS (3-5)
Moments de vie declencheurs avec:
- situation, trigger, emotion, urgency (1-10), bestAngleType (EPIC)

### 7. COMPORTEMENT DIGITAL
Plateformes, preferences contenu, horaires, device, attention span

### 8. PARCOURS CLIENT
Canaux de decouverte, comportement recherche, facteurs decision, post-achat

### 9. AFFINITES ANGLES (si angles fournis)
Score d'affinite (1-10) avec raison pour chaque angle

## REGLES

- Sois SPECIFIQUE et CONCRET
- Les desirs niveau 5 doivent etre EXISTENTIELS
- Les triggers doivent etre des MOMENTS DE VIE reels
- Les beliefs incluent croyances LIMITANTES et HABILITANTES
- Chaque persona = RADICALEMENT different

Reponds UNIQUEMENT en JSON valide (array de ${validCount} personas), sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Genere ${validCount} persona(s) riche(s).

${context}

=== FORMAT JSON ATTENDU (array de ${validCount} objets) ===

[
  {
    "name": "Marie, 34 ans",
    "avatar": "Femme brune, cheveux mi-longs, traits fatigues mais souriants, tenue decontractee chic, fond de cuisine moderne",
    "tagline": "La mere active qui culpabilise de ne pas cuisiner maison",
    "demographics": {
      "ageRange": "30-40",
      "gender": "Femme",
      "location": "Banlieue parisienne",
      "income": "50-70k EUR",
      "profession": "Cadre moyenne",
      "familyStatus": "Mariee, 2 enfants (4 et 7 ans)",
      "education": "Bac+5"
    },
    "psychographics": {
      "desires": [
        {"level": 1, "description": "Je veux des snacks sains pour mes enfants"},
        {"level": 2, "description": "Je veux que mes enfants mangent mieux sans bataille"},
        {"level": 3, "description": "Je veux me sentir comme une bonne mere"},
        {"level": 4, "description": "Je veux etre la mere qui donne le meilleur"},
        {"level": 5, "description": "Je veux que mes enfants sachent que je les aime"}
      ],
      "fears": ["Etre une mauvaise mere", "Endommager la sante de ses enfants"],
      "frustrations": ["Manque de temps", "Enfants difficiles", "Culpabilite permanente"],
      "aspirations": ["Equilibre vie pro/perso", "Famille epanouie"],
      "values": ["Sante", "Authenticite", "Famille"],
      "beliefs": ["Les bons produits coutent cher (limitante)", "Une bonne mere fait des sacrifices (habilitante)"]
    },
    "buyingPsychology": {
      "primaryDefense": "Rationalisation (cherche des preuves pour justifier)",
      "resistancePatterns": ["Compare obsessivement", "Attend les promos", "Demande l'avis du conjoint"],
      "trustBuilders": ["Avis de meres similaires", "Labels bio/naturel", "Marques transparentes"],
      "decisionStyle": "social",
      "riskTolerance": "modere"
    },
    "languageProfile": {
      "vocabularyLevel": "intermediaire",
      "preferredTone": ["Bienveillant", "Complice", "Sans jugement"],
      "triggerWords": ["naturel", "sans culpabilite", "approuve par les mamans", "pratique"],
      "avoidWords": ["parfait", "ideal", "sacrifice", "devoir"],
      "metaphorsResonant": ["Armure protectrice", "Bulle de bien-etre", "Coup de pouce"],
      "socialProofType": "pairs"
    },
    "situationalTriggers": [
      {
        "situation": "Sortie d'ecole pressée",
        "trigger": "Enfant reclame un gouter",
        "emotion": "Culpabilite + stress",
        "urgency": 8,
        "bestAngleType": "practical"
      },
      {
        "situation": "Dimanche soir preparation semaine",
        "trigger": "Planification des repas",
        "emotion": "Charge mentale",
        "urgency": 6,
        "bestAngleType": "emotional"
      }
    ],
    "digitalBehavior": {
      "platforms": ["Instagram", "Facebook", "Pinterest"],
      "contentPreferences": ["Temoignages meres", "Recettes rapides", "Astuces organisation"],
      "peakActivityTimes": ["12h-14h", "21h-23h"],
      "devicePreference": "mobile",
      "attentionSpan": "court"
    },
    "customerJourney": {
      "awarenessChannels": ["Instagram ads", "Recommandations amies", "Blogs parentalite"],
      "researchBehavior": "Compare 3-4 options, lit les avis, verifie les ingredients",
      "decisionFactors": ["Avis positifs", "Ingredients naturels", "Rapport qualite/prix"],
      "postPurchaseBehavior": "Partage sur les groupes maman si satisfaite"
    },
    "angleAffinities": [
      {
        "angleId": "angle_1",
        "affinityScore": 9,
        "reason": "Resonne avec la culpabilite maternelle"
      }
    ],
    "fieldConfidences": {
      "demographics": 0.9,
      "desires": 0.85,
      "triggers": 0.8
    },
    "gaps": []
  }
]`,
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
    console.error("[PersonaGenerator] JSON parse error:", jsonStr.slice(0, 400));
    throw new Error(`Persona Generator: JSON invalide — ${(e as Error).message}`);
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
