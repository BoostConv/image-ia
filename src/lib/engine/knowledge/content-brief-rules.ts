// ============================================================
// KNOWLEDGE: CONTENT BRIEF & VISUAL HIERARCHY (COMPLETE)
// Source: base_connaissances_content_brief_visuel.pdf
// Visual psychology, brief anatomy, anti-AI, ugly ads, checklists.
// ============================================================

/**
 * Visual psychology — System 1/2 and cognitive ease.
 */
export const VISUAL_PSYCHOLOGY = {
  system1: {
    description: "Rapide, automatique, intuitif — 98% de notre pensee. Decide en une fraction de seconde si l'ad merite attention.",
    objective: "Communiquer EXCLUSIVEMENT avec le Systeme 1. Design clair, epure = aisance cognitive = prospect receptif.",
    enemy: "Design encombre ou confus = tension cognitive = Systeme 2 sceptique active = prospect scroll.",
  },
  cognitive_ease: "Quand le design est clair, le cerveau interprete l'info comme VRAIE, FAMILIERE et DIGNE DE CONFIANCE.",
  halo_effect: "Un visuel premium, soigne, avec belle lumiere et textures riches transfere automatiquement cette perception de qualite au produit. Chaque detail du Content Brief contribue.",
  key_rule: "Chaque decision visuelle (placement texte, espace blanc, hierarchie) doit REDUIRE la charge cognitive. Moins le cerveau travaille, plus l'ad convertit.",
} as const;

/**
 * Reading patterns — Z and F schemas.
 */
export const READING_PATTERNS = {
  z_pattern: {
    when: "Ads visuelles avec peu de texte (la majorite). REGLE PAR DEFAUT.",
    trajectory: "Haut-gauche → Haut-droit → Diagonale bas → Bas-gauche → Bas-droit",
    placement: {
      headline: "En haut (debut du Z)",
      visual_product: "Au centre de la diagonale",
      subtext_cta: "En bas, idealement vers la droite (fin du Z)",
      logo: "Haut gauche (debut Z) ou bas droite (fin Z)",
    },
  },
  f_pattern: {
    when: "UNIQUEMENT pour layouts Text-Heavy deliberes (Confession, Letter, Manifesto). JAMAIS par defaut.",
    trajectory: "Lecture horizontale en haut → second balayage plus court au milieu → balayage vertical a gauche",
    placement: {
      left_side: "Recoit plus d'attention — y placer les elements cles",
      headline: "Occupe toute la largeur en haut (premiere barre du F)",
    },
  },
} as const;

/**
 * Content Brief anatomy — how to write the image prompt.
 */
export const CONTENT_BRIEF_ANATOMY = {
  language: "Anglais, 80-150 mots",
  mandatory_elements: [
    "Scene description (ce qu'on VOIT, pas ce qu'on VEUT)",
    "Lighting specifique (softbox, golden hour, window light...)",
    "Color palette (mood-based, PAS de hex codes dans le brief)",
    "Photography style (35mm film, phone camera, studio...)",
    "Mood/atmosphere",
    "Product placement (OU et COMMENT visible)",
    "Texture specifics (materiaux, surfaces, qualite peau)",
  ],
  rules: [
    "Decrire ce qu'on VOIT, pas ce qu'on VEUT",
    "Etre specifique sur textures, materiaux, lumiere",
    "Anti-IA: 'Shot on [device]', focale, 'Hyperrealistic, NOT AI-looking'",
    "Prevoir zones de respiration pour le texte overlay",
    "Specifier annotations flechees si necessaires",
    "Si objet doit etre transparent/visible, specifier explicitement",
    "Terminer par: 'All text overlays on the image must be in French.'",
  ],
  text_overlay: {
    rule: "Texte en OVERLAY direct sur la photo. JAMAIS de bloc couleur separe qui coupe la photo.",
    contrast: "Toujours specifier couleur contrastante du texte vs arriere-plan.",
    highlight: "Si highlight de mot: fond de couleur branding DERRIERE le mot (pas juste des guillemets), un seul mot/groupe par headline.",
  },
} as const;

/**
 * Anti-AI rendering rules.
 */
export const ANTI_AI_RULES = {
  skin: {
    must: ["Visible skin pores", "Natural skin texture", "Peach fuzz", "Micro-imperfections", "Asymmetric features"],
    avoid: ["Plastic-looking skin", "Divine lighting", "Perfect symmetry", "Airbrushed look"],
    technique: "'Shot on 35mm film', 'Kodak Portra 400', 'visible film grain'",
  },
  environment: {
    must: ["Natural imperfections", "Lived-in feel", "Realistic wear and tear"],
    avoid: ["Too-perfect environment", "Uncanny valley", "Obvious AI artifacts"],
  },
  lighting: {
    must: ["Motivated light sources (visible window, lamp, sun)", "Natural shadows", "Consistent light direction"],
    avoid: ["Flat ethereal glow", "Multiple conflicting light sources", "No visible light source"],
  },
  camera_references: [
    "Canon EOS R5, 85mm f/1.4 — portraits, lifestyle",
    "iPhone 14 Pro — UGC, raw style",
    "Hasselblad 500C — premium, fashion",
    "35mm Kodak Portra 400 — warm, authentic",
    "Sony A7III, 50mm f/1.8 — product, editorial",
  ],
} as const;

/**
 * Ugly Ads methodology.
 */
export const UGLY_ADS = {
  principle: "Casser la cecite publicitaire avec une esthetique amateur, brute, non polie. Le cerveau ne filtre pas le contenu qui ne ressemble pas a une pub.",
  when: ["Unaware/Problem-Aware audiences", "Marche sature de belles pubs", "Marques fun/decontractees/provocatrices"],
  not_for: ["Marques premium", "Marques luxe", "Marques serieuses"],
  formats: [
    "Texte manuscrit sur photo raw",
    "Screenshot de conversation/DM",
    "Post-it photographie",
    "Notes app screenshot",
    "Photo mal cadree volontairement",
    "Meme brut",
    "Texte au marqueur",
  ],
  key_rule: "Ugly ≠ bacle. L'ugly ad est STRATEGIQUEMENT imparfaite — chaque imperfection est un choix delibere pour maximiser l'authenticite percue.",
  batch_ratio: "Sur un batch de 50 ads: 5-10 ugly ads (10-20%). Verifier coherence avec le ton de marque.",
} as const;

/**
 * Visual hierarchy rules for serving persuasive patterns.
 */
export const VISUAL_FOR_PATTERNS: Record<string, string> = {
  pas: "Le visuel montre LE PROBLEME de maniere inconfortable, puis le produit comme soulagement.",
  desire: "Le visuel fait RESSENTIR l'experience (texture, odeur, lumiere). Produit integre dans un moment de vie desirable.",
  social_proof: "Le visuel montre les AUTRES (vrais gens, commentaires, chiffres). Format UGC/testimonial prioritaire.",
  us_vs_them: "Le contraste visuel fait l'argument. Deux zones distinctes — une terne, une vibrante.",
  education: "Le visuel est informatif — infographie, annotations, donnees. Le format educatif fait oublier que c'est une pub.",
  identity: "Le visuel reflete L'IDENTITE du persona. Le produit est marqueur d'appartenance dans la scene.",
  disruption: "Le visuel cree un PATTERN BREAK dans le feed — contraste Von Restorff, format inhabituel.",
  before_after: "Le visuel montre le DELTA de changement. La transformation est le heros du visuel.",
  proof_stacking: "Chaque element visuel est un argument independant. L'accumulation cree l'effet de masse.",
  loss_aversion: "Le visuel rend la PERTE tangible et visuelle. Ce que le prospect gache chaque jour.",
};

/**
 * Gaze direction and model rules.
 */
export const GAZE_RULES = {
  direct_gaze: "Modele regardant la camera = bloqueur d'attention (vampire effect). BON pour awareness, MAUVAIS pour conversion.",
  directed_gaze: "Modele regardant le produit/CTA = fleche invisible guidant l'oeil. BEAUCOUP plus efficace pour conversion.",
  rule: "Si visage present, il DOIT regarder VERS le produit ou CTA, jamais dans le vide.",
  no_face: "Pour ads produit pur: pas de visage = pas de vampire effect = attention 100% sur le produit.",
} as const;

/**
 * Guard rails for visuals — NEVER do.
 */
export const VISUAL_GUARD_RAILS = [
  "JAMAIS de texte dans un bloc de couleur separe qui coupe la photo",
  "JAMAIS de visage qui regarde directement l'utilisateur (effet vampire) sauf awareness volontaire",
  "JAMAIS deux points focaux en competition",
  "JAMAIS de rendu IA detectable (peau plastique, lumiere divine, environnement trop parfait)",
  "JAMAIS d'ad sans le produit visible sur l'image",
  "JAMAIS de couleurs hex ou noms de polices dans le Content Brief — se referer au brand style reference",
  "JAMAIS de modification du produit fourni en reference — le produit est sacre",
  "JAMAIS de texte reformule — mot pour mot obligatoire",
  "JAMAIS de mots anglais dans le visuel — tout en francais",
  "JAMAIS de format francais converti en anglais (heures 24h, virgule decimale, € apres le chiffre)",
] as const;

/**
 * Content brief validation checklist.
 */
export const CONTENT_BRIEF_CHECKLIST = [
  "La scene est-elle decrite en termes de ce qu'on VOIT (pas ce qu'on veut)?",
  "L'eclairage est-il specifie (type, direction, intensite)?",
  "La texture/matiere du produit est-elle decrite?",
  "La zone de respiration pour le texte est-elle prevue?",
  "L'instruction anti-IA est-elle incluse (Shot on..., NOT AI-looking)?",
  "Le produit est-il visible et identifiable?",
  "Le schema de lecture (Z ou F) est-il respecte dans le placement?",
  "Les annotations flechees sont-elles specifiees si necessaires?",
  "La coherence copy/visuel est-elle verifiee (zero micro-latence)?",
  "Le texte overlay indique-t-il 'All text overlays must be in French'?",
  "Le brand style reference est-il mentionne?",
  "Le product reference est-il mentionne?",
] as const;

/**
 * Diversification rules for batch generation.
 */
export const DIVERSIFICATION_RULES = {
  patterns: "Ne jamais utiliser le meme pattern deux fois de suite. Sur 50 ads, couvrir minimum 10 patterns differents.",
  sub_types: "Si un pattern est reutilise, changer systematiquement de sous-type.",
  headline_mechanisms: "Alterner entre les 13 mecanismes. Deux ads consecutives ≠ meme mecanisme.",
  layouts: "Couvrir au moins 5 familles de layouts differentes sur 10 ads.",
  emotional_registers: "Alterner: probleme, desir, humour, preuve, identite.",
  ugly_ads: "Sur 50 ads: 5-10 ugly ads. Verifier coherence ton de marque avant d'inclure.",
  check: "Pour chaque ad: si plus de 2 elements sont identiques a une ad precedente, changer de combinaison.",
} as const;

/**
 * Priority order when rules conflict.
 */
export const PRIORITY_ORDER = [
  "1. CLARTE — Le message est compris en 1 seconde",
  "2. SPECIFICITE — Le message parle a CE persona, pas a tout le monde",
  "3. EMOTION — Le message fait ressentir quelque chose",
  "4. CONCISION — Le message utilise le minimum de mots",
  "5. ESTHETIQUE — Le visuel est premium et professionnel",
  "Une ad claire qui vend > une ad jolie qui ne vend pas.",
] as const;

// ============================================================
// DIRECTIVE FUNCTIONS
// ============================================================

/**
 * Get content brief directive for a specific pipeline stage.
 */
export function getContentBriefDirective(stage: "art_director" | "prompt_builder" | "quality_gate" | "planner", brandTone?: string): string {
  switch (stage) {
    case "planner": {
      // Filter UGLY ADS by brand tone — not for premium/luxe/serious/scientific brands
      const uglyAdsLine = (() => {
        if (!brandTone) return `UGLY ADS: ${UGLY_ADS.principle} Formats: ${UGLY_ADS.formats.slice(0, 4).join(", ")}`;
        const toneLower = brandTone.toLowerCase();
        const excludeTones = ["luxe", "luxury", "premium", "pharma", "scientifique", "serieu", "medical", "haut de gamme", "clean"];
        const isExcluded = excludeTones.some(t => toneLower.includes(t));
        if (isExcluded) return ""; // Skip UGLY ADS for this brand tone
        return `UGLY ADS: ${UGLY_ADS.principle} Formats: ${UGLY_ADS.formats.slice(0, 4).join(", ")}`;
      })();

      return `PSYCHOLOGIE VISUELLE:
- ${VISUAL_PSYCHOLOGY.key_rule}
- ${VISUAL_PSYCHOLOGY.cognitive_ease}
- ${VISUAL_PSYCHOLOGY.halo_effect}
SCHEMA Z (defaut): ${READING_PATTERNS.z_pattern.trajectory}
${uglyAdsLine ? uglyAdsLine + "\n" : ""}DIVERSIFICATION: ${DIVERSIFICATION_RULES.patterns} ${DIVERSIFICATION_RULES.layouts}`;
    }

    case "art_director":
      return `PSYCHOLOGIE VISUELLE:
- Systeme 1: ${VISUAL_PSYCHOLOGY.system1.objective}
- Effet de halo: ${VISUAL_PSYCHOLOGY.halo_effect}
- Schema Z: ${READING_PATTERNS.z_pattern.trajectory}
  Headline en haut, Produit au centre, CTA en bas-droite
GAZE CUEING:
- ${GAZE_RULES.directed_gaze}
- ${GAZE_RULES.rule}
ANTI-IA: ${ANTI_AI_RULES.skin.technique}. Peau: ${ANTI_AI_RULES.skin.must.join(", ")}
TEXT OVERLAY: ${CONTENT_BRIEF_ANATOMY.text_overlay.rule}`;

    case "prompt_builder":
      return `CONTENT BRIEF RULES:
- Langue: ${CONTENT_BRIEF_ANATOMY.language}
- ${CONTENT_BRIEF_ANATOMY.rules.join("\n- ")}
ANTI-IA: ${ANTI_AI_RULES.skin.technique}
Cameras: ${ANTI_AI_RULES.camera_references.slice(0, 3).join(" / ")}
TEXT: ${CONTENT_BRIEF_ANATOMY.text_overlay.rule}
Terminer par: 'All text overlays on the image must be in French.'`;

    case "quality_gate":
      return `CHECKLIST QUALITE CONTENT BRIEF:
${CONTENT_BRIEF_CHECKLIST.map((c, i) => `${i + 1}. ${c}`).join("\n")}
GARDE-FOUS VISUELS:
${VISUAL_GUARD_RAILS.map(r => `- ${r}`).join("\n")}
PRIORITE: ${PRIORITY_ORDER[0]}`;

    default:
      return "";
  }
}

/**
 * Get visual strategy directive for a specific pattern.
 */
export function getVisualForPatternDirective(patternId: string): string {
  return VISUAL_FOR_PATTERNS[patternId] || "";
}
