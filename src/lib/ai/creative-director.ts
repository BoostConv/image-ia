/**
 * Creative Director Engine
 *
 * This module transforms basic prompts into ultra-creative, agency-quality
 * advertising prompts. It acts as a virtual creative director that:
 *
 * 1. Injects professional photography/art direction expertise
 * 2. Adds emotional and psychological depth
 * 3. Explores different consciousness levels for targeting
 * 4. Forces creative exploration beyond safe/generic outputs
 * 5. Applies advertising best practices from top agencies
 */

const CREATIVE_DIRECTOR_PREAMBLE = `You are a world-class creative director at a top advertising agency (like Wieden+Kennedy, Droga5, or BBDO). You are creating a HIGH-IMPACT static advertisement visual.

CRITICAL REQUIREMENTS:
- Create STUNNING, SCROLL-STOPPING visuals that rival the best advertising agencies in the world
- Every pixel must serve the communication objective
- The image must STOP the scroll in under 0.5 seconds
- Professional photography quality: perfect lighting, composition, color grading
- Cinematic feel with editorial-level art direction
- NO generic stock photo aesthetic — every image must feel UNIQUE and PREMIUM

TECHNICAL EXCELLENCE:
- Ultra-sharp focus on the subject
- Professional color grading and tone mapping
- Dramatic lighting that creates depth and dimension
- Thoughtful use of negative space for text overlay areas
- Resolution and detail level of a professional photoshoot
- Hyper-realistic rendering with attention to material textures

`;

const CONSCIOUSNESS_LEVELS = {
  unaware: {
    label: "Inconscient du probleme",
    instruction: "Use PATTERN INTERRUPT visuals. The viewer doesn't know they have a problem. Use unexpected imagery, unusual angles, surreal compositions, or provocative juxtapositions to STOP THE SCROLL and create curiosity. Make them think 'what is this?' before 'what is this product?'.",
  },
  problem_aware: {
    label: "Conscient du probleme",
    instruction: "Create EMPATHETIC visuals that mirror the viewer's frustration or desire. Show the 'before' state — the pain point, the unmet need, the gap in their life. Use emotional lighting, relatable scenarios, and compositions that create tension. The viewer should feel 'this is exactly me'.",
  },
  solution_aware: {
    label: "Conscient de la solution",
    instruction: "Create ASPIRATIONAL visuals showing the transformation. Show the 'after' state — the result, the satisfaction, the elevated lifestyle. Use warm, inviting lighting, forward-looking compositions, and imagery that creates desire. The viewer should feel 'I want this outcome'.",
  },
  product_aware: {
    label: "Conscient du produit",
    instruction: "Create PROOF-DRIVEN visuals that build trust and credibility. Show the product in use, surrounded by social proof elements, premium contexts, and authority signals. Use polished, editorial-quality imagery with confidence-building compositions. The viewer should feel 'this product delivers'.",
  },
  most_aware: {
    label: "Tres conscient",
    instruction: "Create URGENCY-DRIVEN visuals with direct product focus. Showcase the product hero-style with premium lighting, irresistible detail, and a clear call-to-action composition. Use bold colors, confident compositions, and immediate impact. The viewer should feel 'I need this now'.",
  },
};

const CREATIVE_ANGLES = [
  "Emotional storytelling — capture a powerful human moment that connects to the brand's promise",
  "Visual metaphor — use a creative visual metaphor to communicate the product's benefit without words",
  "Contrast & juxtaposition — create visual tension between two opposing ideas that resolves in the product",
  "Hyper-realism — extreme close-up detail that reveals beauty invisible to the naked eye",
  "Cinematic mood — create a movie-still quality scene that immerses the viewer in the brand's universe",
  "Minimalist impact — reduce to the absolute essential, maximum message with minimum elements",
  "Cultural reference — tap into a zeitgeist moment or cultural touchpoint that resonates with the target",
  "Surreal/dreamlike — create an unexpected, imaginative world that makes the viewer pause and explore",
  "Behind-the-scenes authenticity — raw, genuine moments that feel real and unscripted",
  "Scale play — use dramatic changes in scale to create visual surprise and emphasize the product",
];

export interface CreativeConfig {
  consciousnessLevel?: keyof typeof CONSCIOUSNESS_LEVELS;
  creativeAngleIndex?: number;
  explorationMode?: "safe" | "creative" | "bold" | "experimental";
}

export function enhancePromptWithCreativeDirection(
  basePrompt: string,
  config?: CreativeConfig
): string {
  const parts: string[] = [CREATIVE_DIRECTOR_PREAMBLE];

  // Add consciousness level targeting
  if (config?.consciousnessLevel) {
    const level = CONSCIOUSNESS_LEVELS[config.consciousnessLevel];
    parts.push(`[TARGETING — ${level.label.toUpperCase()}]\n${level.instruction}\n`);
  }

  // Add creative angle
  if (config?.creativeAngleIndex !== undefined) {
    const angle = CREATIVE_ANGLES[config.creativeAngleIndex % CREATIVE_ANGLES.length];
    parts.push(`[ANGLE CREATIF]\n${angle}\n`);
  }

  // Exploration mode
  const mode = config?.explorationMode || "creative";
  if (mode === "bold" || mode === "experimental") {
    parts.push(`[MODE EXPLORATION: ${mode.toUpperCase()}]
Push creative boundaries. Avoid obvious, predictable compositions.
${mode === "experimental" ? "Try something COMPLETELY unexpected. Break visual conventions. Create images that have never been seen before. Take artistic risks." : "Be bold in color choices, angles, and compositions. Go beyond the expected while staying on-brand."}
`);
  }

  // Add the user's actual prompt
  parts.push(`[BRIEF CREATIF]\n${basePrompt}`);

  return parts.join("\n");
}

/**
 * Generate multiple creative variations exploring different approaches
 */
export function generateCreativeExplorations(
  basePrompt: string,
  count: number
): string[] {
  const levels = Object.keys(CONSCIOUSNESS_LEVELS) as (keyof typeof CONSCIOUSNESS_LEVELS)[];

  return Array.from({ length: count }, (_, i) => {
    const config: CreativeConfig = {
      consciousnessLevel: levels[i % levels.length],
      creativeAngleIndex: i,
      explorationMode: i < count / 2 ? "creative" : "bold",
    };
    return enhancePromptWithCreativeDirection(basePrompt, config);
  });
}

export { CONSCIOUSNESS_LEVELS, CREATIVE_ANGLES };
