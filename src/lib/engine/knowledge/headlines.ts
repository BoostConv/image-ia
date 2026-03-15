import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: HEADLINE TEMPLATES
// Source: PDF0 (100 Headline Templates) + PDF1 Section 2 (Visual Headlines)
// Distilled for injection into Composer & Planner stages.
// ============================================================

export interface HeadlineTemplate {
  template: string;
  example: string;
  category: "pain" | "desire" | "proof" | "urgency" | "curiosity" | "authority" | "transformation";
  funnel: "tofu" | "mofu" | "bofu";
  awareness: AwarenessLevel[];
}

/**
 * 20 Visual Headline templates (for text ON the image).
 * Short, punchy — max 7 words on the visual.
 * Category A = Pain/Prevention (Prudent mindstate)
 * Category B = Desire/Promotion (Optimist mindstate)
 */
export const VISUAL_HEADLINES = {
  pain: [
    { id: "problem_solver", template: "No more [Unwanted Condition]", example: "No more insomnia" },
    { id: "rescuer", template: "Rescue your [Asset] from [Problem]", example: "Rescue your skin from harsh chemicals" },
    { id: "uplifter", template: "Don't settle for [Bad State]", example: "Don't settle for boring workouts" },
    { id: "streamliner", template: "Cut down your [Tedious Routine]", example: "Cut down your morning commute" },
    { id: "breakthrough", template: "Break the shackles of [Limitation]", example: "Break the shackles of 9-to-5" },
    { id: "eye_opener", template: "Did you know [Situation] could happen?", example: "Did you know too many toys hurt focus?" },
    { id: "frustration_fixer", template: "Sick of [Problem]?", example: "Sick of constant fatigue?" },
    { id: "insider_tip", template: "How [Audience] are [Solving Pain]", example: "How busy moms are saving hours" },
    { id: "instant_fix", template: "[Problem]? [Solution]", example: "Bloating? Gone in 3 seconds" },
    { id: "relief_provider", template: "Get rid of [Problem]", example: "Get rid of bloating" },
  ],
  desire: [
    { id: "visionary", template: "Imagine [Achievable Dream]", example: "Imagine a spotless kitchen" },
    { id: "persona_maker", template: "Be the [Desired Persona]", example: "Be the lion in bed" },
    { id: "barrier_breaker", template: "[Bold Claim], Without [Barrier]", example: "Clear skin, without the chemicals" },
    { id: "superlative", template: "The [Adj] you've ever [Experience]", example: "The softest your clothes have ever felt" },
    { id: "delightful_surprise", template: "So [Positive], you'll forget it's [Obstacle]", example: "So tasty, you'll forget it's healthy" },
    { id: "effortless_upgrade", template: "[Task] doesn't have to be [Negative]", example: "Dressing for work shouldn't feel like work" },
    { id: "perfect_pair", template: "[Trait 1] meets [Trait 2]", example: "Beauty meets weight loss" },
    { id: "outcome_promise", template: "The [Product] makes sure you [Outcome]", example: "Makes sure you get perfect sleep" },
    { id: "upgrader", template: "Build a [Desired Trait]", example: "Build a winning mindset" },
    { id: "delight_trigger", template: "Warning: May Cause [Desirable State]", example: "Warning: May cause scent euphoria" },
  ],
} as const;

/**
 * Caption/post headline templates by funnel stage.
 * More narrative — for longer copy or captions.
 */
export const CAPTION_HEADLINES: Record<"tofu" | "mofu" | "bofu", string[]> = {
  tofu: [
    "Struggling to [Achieve Outcome]?",
    "3 Things You Didn't Know About [Topic]",
    "Are You Making These [N] Mistakes in [Activity]?",
    "[Uncommon Fact] That Changes Everything About [Topic]",
    "Think [Achieving Goal] Is Hard? Think Again.",
    "The [N] Secrets Every [Audience] Must Know",
    "What [Expert] Wish You Knew About [Topic]",
    "[Target Problem]? Here's What to Do About It",
    "How [Problem] Could Be Ruining [Aspect of Life]",
    "Start [Action] Today and See [Result] Tomorrow",
    "What Happens If You Ignore [Specific Problem]?",
    "[Unusual Solution] That Solves [Common Problem]",
    "This Simple Trick Could Change [Aspect of Life] Forever",
    "[N] Myths About [Topic] Debunked",
    "Is Your [Topic] Holding You Back?",
  ],
  mofu: [
    "Why [Problem] Is Worse Than You Think",
    "Stop Wasting [Resource] on [Common Mistake]",
    "How to [Solve Problem] Without [Common Drawback]",
    "Discover [N] Ways to [Achieve Outcome]",
    "The Real Reason You're Struggling With [Problem]",
    "Unlock the Secret to [Outcome] in [Time Frame]",
    "Don't Buy [Solution Type] Until You Read This",
    "The Truth About [Topic] That No One Tells You",
    "Why [Conventional Solution] Isn't Working for You",
    "Say Goodbye to [Problem] for Good",
    "The [Solution] Trusted by [Target Audience]",
    "Finally: A Solution for [Problem] That Actually Works",
    "[N] Surprising Benefits of [Solution]",
    "Why Everyone Is Talking About [Solution]",
    "How to Get [Outcome] Without Breaking the Bank",
  ],
  bofu: [
    "Ready to [Achieve Outcome]? Start Here.",
    "[Solution] That [Specific Result] in [Time Frame]",
    "Why [Product] Is Trusted by [Authority]",
    "Get [Benefit] Without [Common Obstacle]",
    "[N] Reasons Customers Love [Product]",
    "Don't Miss Out on [Unique Opportunity]",
    "Limited Time Offer: Get [Product] Now",
    "[Product] Backed by [Proof/Science]",
    "Join [N] Others Who Are [Achieving Outcome]",
    "Try [Product] Risk-Free for [Time Frame]",
    "Transform [Pain Point] With [Solution]",
    "Your [Problem] Ends Here",
    "Save [Valuable Resource] With [Product]",
    "[Solution] Proven to [Achieve Result]",
    "Say Yes to [Positive Outcome] With [Solution]",
  ],
};

/**
 * Text-on-image formatting rules from PDF1.
 */
export const TEXT_ON_IMAGE_RULES = {
  maxCoveragePercent: 20,
  maxHeadlineWords: 10,
  hierarchy: {
    headline: "Large size, Bold weight",
    subHeadline: "Medium size",
    cta: "Accent color, high contrast",
  },
  contrast: "Always specify contrasting text color vs background (white on dark, black on light)",
} as const;
