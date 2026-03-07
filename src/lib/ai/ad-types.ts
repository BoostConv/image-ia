// ============================================================
// AD CONCEPT TYPES — Structure for real ad creation
// ============================================================

export type AdLayoutType =
  | "hero_product"      // Product prominent, headline + CTA (like Harry's, Dermalogica)
  | "us_vs_them"        // Split comparison (like Javy)
  | "before_after"      // Old/New split (like Spacegoods)
  | "benefit_callout"   // Product with benefit badges/stats (like Aloha)
  | "product_showcase"  // Clean product display with key info
  | "social_proof"      // Testimonial/guarantee focused
  | "lifestyle_overlay" // Lifestyle scene with text overlay
  | "minimal_impact";   // Bold text + minimal product

export interface AdCopy {
  headline: string;           // Main headline text
  subheadline?: string;       // Secondary text
  benefits?: string[];        // Bullet points / benefit list
  cta?: string;               // Call to action text
  guarantee?: string;         // Guarantee badge text (e.g. "100% Money-Back")
  stats?: Array<{             // Number callouts (e.g. "14g Protein")
    value: string;
    label: string;
  }>;
  comparisonLeft?: {          // For us_vs_them layout
    title: string;
    points: string[];
  };
  comparisonRight?: {
    title: string;
    points: string[];
  };
  beforeLabel?: string;       // For before_after layout
  afterLabel?: string;
  tagline?: string;           // Brand tagline
}

export interface AdStyling {
  backgroundColor: string;    // Hex color for background
  backgroundGradient?: {
    from: string;
    to: string;
    direction: "horizontal" | "vertical" | "diagonal";
  };
  textColor: string;          // Primary text color
  accentColor: string;        // Accent for CTAs, badges
  headlineSize: "small" | "medium" | "large" | "xl";
  fontStyle: "bold_sans" | "elegant_serif" | "modern_minimal" | "playful" | "luxury";
  productPlacement: "center" | "left" | "right" | "bottom" | "top_right" | "top_left";
  productScale: number;       // 0.3 to 1.0
  overlayOpacity?: number;    // For text readability over backgrounds
}

export interface AdConcept {
  layout: AdLayoutType;
  copy: AdCopy;
  styling: AdStyling;
  backgroundPrompt: string;   // Prompt for Nano Banana (background ONLY, no text, no product)
  creativeRationale: string;  // Why this concept works
  consciousnessLevel: string; // Marketing consciousness level
  emotionalHook: string;
}

export interface AdCompositionInput {
  concept: AdConcept;
  backgroundImage: Buffer;    // Generated background from Nano Banana
  productImage?: Buffer;      // Real product photo
  logoImage?: Buffer;         // Brand logo
  width: number;
  height: number;
  brandName: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Dimensions for each format
export const AD_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "3:2": { width: 1200, height: 800 },
  "2:3": { width: 800, height: 1200 },
};
