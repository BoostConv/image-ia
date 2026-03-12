// ============================================================
// KNOWLEDGE: NEURO-DESIGN PRINCIPLES
// Source: PDF4 — 55+ visual hierarchy principles
// Distilled rules for composition, attention, color psychology.
// ============================================================

/**
 * Core neuro-design principles for visual hierarchy.
 * Each principle has an actionable application for image generation.
 */
export const NEURO_DESIGN_PRINCIPLES = {
  // 1. Eye tracking patterns
  reading_patterns: {
    z_pattern: "For visual/image ads: eye goes top-left → top-right → diagonal down → bottom-left → bottom-right. Place logo top-left, CTA bottom-right.",
    f_pattern: "For text-heavy ads: eye scans top bar, drops down, scans shorter bar. Put key info in first 2 lines.",
    rule: "Align key elements (product, CTA) along natural eye trajectory.",
  },

  // 2. Size & Scale
  size_scale: {
    principle: "The brain associates SIZE with IMPORTANCE. Largest element = starting point.",
    application: "Make product or key message visually largest. Everything else supports it.",
  },

  // 3. Color & Contrast
  color_contrast: {
    principle: "High contrast elements attract eye irresistibly. Complementary colors create memorable contrast.",
    warm_colors: "Red/Orange = urgency, passion, action. Use for CTAs and alerts.",
    cool_colors: "Blue/Green = trust, calm, balance. Use for backgrounds and reassurance.",
    application: "CTA button must be highest-contrast element. Use brand accent color for focal point.",
  },

  // 4. White Space
  white_space: {
    principle: "Empty space is NOT waste — it's a weapon. Isolates key elements, reduces cognitive load.",
    benefit_comprehension: "Strategic white space increases comprehension by 20%.",
    benefit_premium: "More white space = more premium/elegant feel.",
    application: "Surround product and CTA with generous spacing. Never fill every pixel.",
  },

  // 5. Gaze Cueing
  gaze_cueing: {
    principle: "Humans automatically follow where another person looks (survival reflex).",
    direct_gaze: "Model looking at camera = attention blocker (vampire effect). Good for brand awareness, bad for CTA.",
    directed_gaze: "Model looking at product/CTA = invisible arrow guiding viewer's eye. Much more effective for conversions.",
    application: "If using human faces, ensure they look TOWARD the product or CTA, never away from it.",
  },

  // 6. Focal Point
  focal_point: {
    principle: "Every composition needs ONE main character. All other elements exist only to support it.",
    application: "Designate product or key message as focal point. Use color, size, contrast to make it undeniable.",
  },

  // 7. Cognitive Load
  cognitive_load: {
    system1: "Fast, automatic, intuitive — handles 98% of thinking. Hierarchy speaks to System 1.",
    system2: "Slow, analytical, tiring. Cluttered design forces System 2, causing user to flee.",
    cognitive_ease: "When design is clear, brain considers info as TRUE, GOOD, TRUSTWORTHY.",
    application: "Minimize elements. If user needs to squint or think, redesign. Max 3-4 elements per composition.",
  },

  // 8. Typography Hierarchy
  typography: {
    headline: "Large, bold — immediate attention grabber. Max 7 words.",
    subheadline: "Medium size — supports headline, adds specificity.",
    body: "Smaller — details for those already interested.",
    cta: "Accent color, high contrast, action verb.",
    application: "3 levels max. Each level clearly smaller than the previous.",
  },

  // 9. Proximity & Grouping (Gestalt)
  proximity: {
    principle: "Elements placed close together are perceived as related.",
    application: "Group product + price together. Group proof elements together. Separate distinct messages with space.",
  },

  // 10. Pattern Break
  pattern_break: {
    principle: "Repetition creates rhythm and comfort. BREAKING the pattern draws instant attention.",
    application: "In a feed of colorful photos, use B&W. In a feed of perfect images, use raw/ugly aesthetic.",
  },
} as const;

/**
 * Color psychology quick reference for ad creation.
 */
export const COLOR_PSYCHOLOGY = {
  red: { emotion: "urgency, passion, danger", use: "CTAs, sales, alerts" },
  orange: { emotion: "enthusiasm, action, warmth", use: "CTAs, add to cart buttons" },
  yellow: { emotion: "optimism, attention, warning", use: "highlights, badges, warnings" },
  green: { emotion: "health, growth, calm", use: "eco products, wellness, 'go' signals" },
  blue: { emotion: "trust, stability, professionalism", use: "finance, tech, healthcare" },
  purple: { emotion: "luxury, creativity, mystery", use: "premium products, beauty" },
  black: { emotion: "elegance, power, sophistication", use: "luxury brands, premium feel" },
  white: { emotion: "purity, simplicity, space", use: "backgrounds, minimalist design" },
} as const;

/**
 * Mobile-first design rules.
 */
export const MOBILE_RULES = {
  simplify: "On mobile, prioritize ONLY essential messages and CTA. Remove all secondary info.",
  touch_targets: "CTA area must be visually prominent — thumb-friendly zone in bottom third.",
  readable: "Headline must be readable without zooming. Min effective font: 48px at 1080px canvas.",
  one_message: "One image, one message, one CTA. Never compete for attention on mobile.",
} as const;

/**
 * Compact directive for injection into art director / prompt builder.
 */
export function getNeuroDesignDirective(): string {
  return `REGLES NEURO-DESIGN:
- Pattern Z: elements cles sur la trajectoire haut-gauche → haut-droit → diag → bas-droit
- TAILLE = IMPORTANCE: element le plus grand = point d'entree
- Contraste: CTA = element au plus fort contraste. Couleur accent sur le focal point
- Espace blanc: entoure produit et CTA d'espace genereux. Ne remplis pas chaque pixel
- Regard humain: si visage present, il doit REGARDER vers le produit/CTA (gaze cueing)
- Point focal unique: 1 personnage principal, tout le reste le soutient
- Charge cognitive: max 3-4 elements par composition. Lisible en 0.3s
- Hierarchie typo: Headline (gros, bold) > Sub (moyen) > CTA (accent, contraste)
- Mobile: 1 image, 1 message, 1 CTA. Headline lisible sans zoom`;
}
