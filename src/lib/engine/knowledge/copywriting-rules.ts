// ============================================================
// KNOWLEDGE: COPYWRITING RULES (Clayton Makepeace)
// Source: PDF1 — The Copywriting Vault
// 24 Non-Rules distilled into actionable directives.
// ============================================================

/**
 * Makepeace's 24 Non-Rules organized by category.
 * Each rule has an actionable directive for AI copy generation.
 */
export const MAKEPEACE_RULES = {
  // Category 1: Connection & Personality
  connection: [
    {
      id: 1,
      rule: "BE somebody",
      directive: "Put a human, friendly face on the promotion. People distrust corporations but listen to qualified guides.",
    },
    {
      id: 2,
      rule: "Address the prospect directly",
      directive: "Use 'you/your', never 'we/our'. Talk about THEIR life, feelings, future.",
    },
    {
      id: 3,
      rule: "Be personal",
      directive: "Write like talking to a friend. Use 'I' and 'You'. Say 'Let me help you' not 'We want to help you'.",
    },
    {
      id: 4,
      rule: "Identify with the prospect",
      directive: "Show you've lived the same thing. Reveal a common weakness or frustration to create empathy.",
    },
  ],

  // Category 2: Persuasion Strategy
  persuasion: [
    {
      id: 5,
      rule: "Give the enemy a face",
      directive: "Don't blame abstract concepts. Blame specific 'villains' to channel emotion. Not 'inflation' but 'greedy bankers'.",
    },
    {
      id: 6,
      rule: "Prove every point",
      directive: "Never ask the reader to take your word. Use studies, testimonials, proof to suspend disbelief.",
    },
    {
      id: 7,
      rule: "Don't fear obvious exaggeration",
      directive: "Use clear hyperbole to demonstrate intensity of feeling when appropriate.",
    },
    {
      id: 18,
      rule: "Be specific",
      directive: "Generalities kill sales. Not 'save money' but 'save $99 by calling in the next 10 minutes'.",
    },
  ],

  // Category 3: Style & Language
  style: [
    {
      id: 8,
      rule: "Speak colloquially",
      directive: "Write like people actually talk. Use the target audience's vocabulary. Grammar mistakes for authenticity are OK.",
    },
    {
      id: 9,
      rule: "Jargon isn't always evil",
      directive: "Technical terms can establish expertise and create belonging with specialized audiences.",
    },
    {
      id: 10,
      rule: "Figures of speech are wonderful",
      directive: "Cliches and analogies communicate complex ideas instantly. A good figure of speech is worth 100 words.",
    },
    {
      id: 11,
      rule: "Use power words",
      directive: "Use: Free, New, How, Now, Guaranteed, Discovery. Ban soft words: maybe, try, seek to.",
    },
    {
      id: 13,
      rule: "Aim for precision and power",
      directive: "If a longer word is more emotionally precise, use it. Don't oversimplify.",
    },
  ],

  // Category 4: Mechanics & Structure
  mechanics: [
    {
      id: 14,
      rule: "Short sentences reign",
      directive: "Vigorous. Every word must count. Short sentences create momentum.",
    },
    {
      id: 15,
      rule: "Count commas",
      directive: "Too many commas = run-on sentences or inverted logic. Cut or rewrite.",
    },
    {
      id: 16,
      rule: "Use connectors at paragraph starts",
      directive: "Start with 'And', 'But', 'Plus' to force reading the next paragraph.",
    },
    {
      id: 19,
      rule: "Consider the question",
      directive: "A well-posed question can be a powerful disguised affirmation. 'What's wrong with getting rich faster?'",
    },
    {
      id: 20,
      rule: "When in doubt, cut",
      directive: "If the start is slow, delete the first paragraphs. Eliminate unnecessary repetitions.",
    },
  ],

  // Meta-rules
  meta: [
    {
      id: 21,
      rule: "Break the rules",
      directive: "Never let convention prevent a good idea. Explore beaten paths. Even failure teaches.",
    },
    {
      id: 22,
      rule: "The Tingle Factor",
      directive: "You don't KNOW a text is good, you FEEL it. Connect to the most powerful emotions: Fear, Desire, Anger, Pride.",
    },
    {
      id: 23,
      rule: "Talk to a friend (Tone check)",
      directive: "Ban corporate jargon ('innovative solutions'). Use spoken language. Imagine talking to a friend at a bar.",
    },
    {
      id: 24,
      rule: "Put a face on the enemy",
      directive: "Don't say 'bank fees are high'. Say 'greedy bankers feast on your back'. Personalize the problem source.",
    },
  ],
} as const;

/**
 * Power words to use in headlines and copy.
 */
export const POWER_WORDS = [
  "Free", "New", "How", "Now", "Guaranteed", "Discovery",
  "Proven", "Secret", "Instant", "Finally", "Exclusive",
  "Limited", "Revolutionary", "Breakthrough", "Warning",
] as const;

/**
 * Soft words to AVOID in headlines and copy.
 */
export const BANNED_SOFT_WORDS = [
  "maybe", "perhaps", "try", "seek to", "attempt",
  "hopefully", "might", "could possibly", "we believe",
  "innovative solutions", "cutting-edge", "world-class",
] as const;

/**
 * Compact directive for injection into prompts.
 */
export function getCopywritingDirective(): string {
  return `REGLES COPYWRITING (Makepeace):
- Parle au prospect directement (Tu/Vous), jamais "Nous"
- Donne un visage a l'ennemi (pas de concepts abstraits)
- Prouve chaque affirmation (chiffres, temoignages)
- Sois specifique (pas "economisez" mais "economisez 99$")
- Phrases courtes. Chaque mot compte.
- Mots puissants: Gratuit, Nouveau, Garanti, Decouverte, Maintenant
- Evite: peut-etre, essayer, solutions innovantes, chercher a
- Le "Tingle Factor": le texte doit se RESSENTIR, pas juste se lire
- Ton conversationnel: comme un ami au bar, pas un communique corporate
- 7 mots max pour le headline sur image, 20% max de couverture texte`;
}
