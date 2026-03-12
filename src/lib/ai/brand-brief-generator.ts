import Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithRetry } from "./claude-retry";
import type {
  IdentiteFondamentale,
  PositionnementStrategique,
  TonCommunication,
  BriefMetadata,
  BriefStatus,
} from "../db/schema";

// ============================================================
// BRAND BRIEF GENERATOR — Auto-generates strategic brand brief
// from scraped website data using Claude AI
// ============================================================

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante dans .env.local");
  return new Anthropic({ apiKey: key });
};

export interface ScrapedBrandData {
  siteName?: string;
  description?: string;
  tagline?: string;
  colors: string[];
  fonts: string[];
  headings: string[];
  fullText?: string;
  // Additional pages content
  aboutPageText?: string;
  historyPageText?: string;
}

export interface GeneratedBrief {
  identiteFondamentale: IdentiteFondamentale;
  positionnementStrategique: PositionnementStrategique;
  tonCommunication: TonCommunication;
  metadata: BriefMetadata;
  status: BriefStatus;
}

interface RawBriefResponse {
  identiteFondamentale: {
    vision: string;
    mission: string;
    combatEnnemi: string;
    histoireMarque: string;
    valeurs: Array<{
      name: string;
      signification: string;
      preuve: string;
    }>;
  };
  positionnementStrategique: {
    propositionValeur: string;
    positionnementPrix: {
      niveau: "entree" | "milieu" | "moyen_haut" | "premium" | "luxe";
      prixMoyen?: number;
      justification: string;
    };
    elementDistinctif: string;
    avantagesConcurrentiels: string[];
    tensionsPositionnement: string[];
  };
  tonCommunication: {
    tonDominant: string[];
    registresEncourages: string[];
    registresAEviter: string[];
    vocabulaireRecurrent: string[];
    redLines: string[];
  };
  fieldConfidences: Record<string, number>;
  gaps: Array<{ field: string; reason: string; severity: "warning" | "critical" }>;
  sources: Record<string, string>;
}

/**
 * Generate a comprehensive brand brief from scraped website data.
 *
 * @param brandName - The name of the brand
 * @param scrapedData - Data scraped from the brand's website
 * @returns GeneratedBrief with all strategic sections + metadata
 */
export async function generateComprehensiveBrief(
  brandName: string,
  scrapedData: ScrapedBrandData
): Promise<GeneratedBrief> {
  const client = getClient();

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `Tu es un STRATEGE DE MARQUE SENIOR specialise dans les marques e-commerce DTC (Direct-to-Consumer).

## TA MISSION

A partir des donnees scrapees d'un site web, tu dois generer un BRIEF STRATEGIQUE COMPLET pour guider la creation publicitaire de cette marque.

## METHODE D'INFERENCE

1. **Analyse le contenu** : titres, textes, taglines, mots-cles recurrents
2. **Deduis le positionnement** : prix, audience, niveau de gamme
3. **Identifie le ton** : formel/decontracte, technique/emotionnel, etc.
4. **Detecte les valeurs** : a travers le vocabulaire et les promesses
5. **Note les gaps** : informations manquantes a completer manuellement

## REGLES

- Si une info n'est PAS trouvable → valeur vide "" + gap avec reason
- Chaque champ a un score de confidence (0.0-1.0)
- Cite les SOURCES pour chaque inference ("Page A propos", "Tagline", etc.)
- Prefere l'INFERENCE INTELLIGENTE a l'absence de donnee
- Les "redLines" sont CRITIQUES : ce que la marque ne doit JAMAIS dire/montrer
- Les "tensionsPositionnement" identifient les contradictions ou risques

## FORMAT DE SORTIE

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Genere le brief strategique V1 pour la marque "${brandName}".

=== DONNEES SCRAPEES ===

NOM DU SITE : ${scrapedData.siteName || brandName}
DESCRIPTION META : ${scrapedData.description || "Non trouvee"}
TAGLINE : ${scrapedData.tagline || "Non trouvee"}

COULEURS CSS EXTRAITES :
${scrapedData.colors.length > 0 ? scrapedData.colors.slice(0, 10).join(", ") : "Aucune"}

POLICES :
${scrapedData.fonts.length > 0 ? scrapedData.fonts.join(", ") : "Aucune"}

TITRES/HEADINGS DE LA PAGE :
${scrapedData.headings.length > 0 ? scrapedData.headings.join("\n") : "Aucun"}

TEXTE PAGE PRINCIPALE (extrait) :
${scrapedData.fullText?.slice(0, 3000) || "Non disponible"}

${scrapedData.aboutPageText ? `\nTEXTE PAGE "A PROPOS" :\n${scrapedData.aboutPageText.slice(0, 2000)}` : ""}

${scrapedData.historyPageText ? `\nTEXTE PAGE "HISTOIRE" :\n${scrapedData.historyPageText.slice(0, 2000)}` : ""}

=== FORMAT JSON ATTENDU ===

{
  "identiteFondamentale": {
    "vision": "Ou la marque veut emmener son marche/audience (futur desire)",
    "mission": "Pourquoi la marque existe, quel probleme elle resout",
    "combatEnnemi": "Ce contre quoi la marque lutte (ex: industrie polluante, produits chimiques, fast fashion...)",
    "histoireMarque": "Genese, fondateurs, moments cles (si trouve)",
    "valeurs": [
      {
        "name": "Nom de la valeur (ex: Transparence)",
        "signification": "Ce que ca signifie concretement pour la marque",
        "preuve": "Brevet, certification, chiffre, engagement verifiable"
      }
    ]
  },
  "positionnementStrategique": {
    "propositionValeur": "Proposition de valeur unique en 1-2 phrases",
    "positionnementPrix": {
      "niveau": "entree|milieu|moyen_haut|premium|luxe",
      "prixMoyen": null,
      "justification": "Pourquoi ce niveau de prix (qualite, audience, etc.)"
    },
    "elementDistinctif": "LE truc qui distingue la marque de tous ses concurrents",
    "avantagesConcurrentiels": ["Avantage 1", "Avantage 2"],
    "tensionsPositionnement": ["Risque ou contradiction potentielle"]
  },
  "tonCommunication": {
    "tonDominant": ["adjectif1", "adjectif2", "adjectif3"],
    "registresEncourages": ["Registre encourage 1", "Registre encourage 2"],
    "registresAEviter": ["Registre a eviter 1"],
    "vocabulaireRecurrent": ["mot1", "mot2", "mot3", "mot4", "mot5"],
    "redLines": ["Ce que la marque ne doit JAMAIS dire 1", "JAMAIS dire 2"]
  },
  "fieldConfidences": {
    "vision": 0.8,
    "mission": 0.9,
    "combatEnnemi": 0.5,
    "histoireMarque": 0.3,
    "valeurs": 0.7,
    "propositionValeur": 0.85,
    "positionnementPrix": 0.6,
    "elementDistinctif": 0.7,
    "tonDominant": 0.8,
    "redLines": 0.5
  },
  "gaps": [
    {
      "field": "histoireMarque",
      "reason": "Aucune information sur les fondateurs ou l'origine de la marque trouvee",
      "severity": "warning"
    }
  ],
  "sources": {
    "vision": "Tagline principale",
    "mission": "Page A propos",
    "tonDominant": "Analyse des headings",
    "propositionValeur": "Description meta + hero section"
  }
}

IMPORTANT :
- Genere 3-5 valeurs avec des preuves concretes si possible
- Les redLines sont CRUCIALES pour eviter les faux pas creatifs
- Si confidence < 0.3, ajoute un gap
- Sois SPECIFIQUE, pas generique (pas "qualite" mais "formules certifiees bio")`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Brand Brief Generator: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const raw = JSON.parse(jsonStr.trim()) as RawBriefResponse;

    // Calculate overall confidence
    const confidenceValues = Object.values(raw.fieldConfidences);
    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0.5;

    // Determine status based on gaps and confidence
    const criticalGaps = raw.gaps.filter((g) => g.severity === "critical");
    const status: BriefStatus =
      criticalGaps.length > 0
        ? "incomplete"
        : avgConfidence < 0.5
          ? "draft"
          : "complete";

    const brief: GeneratedBrief = {
      identiteFondamentale: validateIdentite(raw.identiteFondamentale),
      positionnementStrategique: validatePositionnement(raw.positionnementStrategique),
      tonCommunication: validateTon(raw.tonCommunication),
      metadata: {
        gaps: raw.gaps || [],
        sources: raw.sources || {},
        generatedAt: new Date().toISOString(),
        confidence: avgConfidence,
      },
      status,
    };

    console.log("[BrandBriefGenerator] Generated brief:", {
      brandName,
      status: brief.status,
      confidence: brief.metadata.confidence.toFixed(2),
      gaps: brief.metadata.gaps.length,
    });

    return brief;
  } catch (e) {
    console.error("[BrandBriefGenerator] JSON parse error:", jsonStr.slice(0, 400));
    throw new Error(`Brand Brief Generator: JSON invalide — ${(e as Error).message}`);
  }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateIdentite(input: RawBriefResponse["identiteFondamentale"]): IdentiteFondamentale {
  return {
    vision: input?.vision || "",
    mission: input?.mission || "",
    combatEnnemi: input?.combatEnnemi || "",
    histoireMarque: input?.histoireMarque || "",
    valeurs: Array.isArray(input?.valeurs)
      ? input.valeurs.map((v) => ({
          name: v.name || "",
          signification: v.signification || "",
          preuve: v.preuve || "",
        }))
      : [],
  };
}

function validatePositionnement(
  input: RawBriefResponse["positionnementStrategique"]
): PositionnementStrategique {
  const validNiveaux = ["entree", "milieu", "moyen_haut", "premium", "luxe"] as const;
  const niveau = validNiveaux.includes(input?.positionnementPrix?.niveau as typeof validNiveaux[number])
    ? input.positionnementPrix.niveau
    : "milieu";

  return {
    propositionValeur: input?.propositionValeur || "",
    positionnementPrix: {
      niveau,
      prixMoyen: input?.positionnementPrix?.prixMoyen,
      justification: input?.positionnementPrix?.justification || "",
    },
    elementDistinctif: input?.elementDistinctif || "",
    avantagesConcurrentiels: Array.isArray(input?.avantagesConcurrentiels)
      ? input.avantagesConcurrentiels
      : [],
    tensionsPositionnement: Array.isArray(input?.tensionsPositionnement)
      ? input.tensionsPositionnement
      : [],
  };
}

function validateTon(input: RawBriefResponse["tonCommunication"]): TonCommunication {
  return {
    tonDominant: Array.isArray(input?.tonDominant) ? input.tonDominant : [],
    registresEncourages: Array.isArray(input?.registresEncourages) ? input.registresEncourages : [],
    registresAEviter: Array.isArray(input?.registresAEviter) ? input.registresAEviter : [],
    vocabulaireRecurrent: Array.isArray(input?.vocabulaireRecurrent)
      ? input.vocabulaireRecurrent
      : [],
    redLines: Array.isArray(input?.redLines) ? input.redLines : [],
  };
}
