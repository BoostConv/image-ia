// ============================================================
// BRAND STYLE POLICY
// Explicit rules for what the brand allows visually.
// Maps StyleMode × VisualStyle to permission levels.
//
// brand_native  = On-brand, safe, expected.
// brand_adjacent = Close enough, some stretch.
// stretch       = Pushing boundaries, needs approval.
// forbidden     = Never. Rejects if selected.
//
// Used by:
//   - ConceptPlanner: to constrain style choices
//   - CreativeCritic: to penalize forbidden combos
//   - AdDirector: to adjust visual direction
// ============================================================

import type { VisualStyle, StyleMode, RenderFamily, HumanPresence } from "./taxonomy";
import type { FilteredContext } from "./types";

// ─── Permission levels ──────────────────────────────────────

export type StylePermission = "allowed" | "stretch" | "forbidden";

// ─── Brand Style Policy ─────────────────────────────────────

export interface BrandStylePolicy {
  /** Brand name for logging */
  brand_name: string;

  /** Which visual styles are allowed per style mode */
  style_permissions: Record<StyleMode, Partial<Record<VisualStyle, StylePermission>>>;

  /** Which render families are preferred (ordered by preference) */
  preferred_render_families: RenderFamily[];

  /** Which human presence levels are allowed */
  human_presence_allowed: HumanPresence[];

  /** Max stretch concepts per batch (0 = none) */
  max_stretch_per_batch: number;

  /** Color constraints */
  color_constraints: {
    /** Must include brand primary color in image */
    require_brand_primary: boolean;
    /** Backgrounds that are forbidden (e.g., ["pure_white", "pure_black"]) */
    forbidden_backgrounds: string[];
    /** Whether neon/fluorescent colors are OK */
    allow_neon: boolean;
  };

  /** Product constraints */
  product_constraints: {
    /** Product must be visible in every ad */
    require_product_visible: boolean;
    /** Minimum product scale (0.0-1.0) — 0 means no minimum */
    min_product_scale: number;
    /** Product can be partially occluded? */
    allow_occlusion: boolean;
    /** Packaging geometry must be exact? */
    require_exact_packaging: boolean;
  };

  /** Copy constraints */
  copy_constraints: {
    /** Max headline length in characters */
    max_headline_chars: number;
    /** CTA forbidden words */
    forbidden_cta_words: string[];
    /** Tone rules */
    tone_rules: string[];
  };
}

// ─── Default policy (permissive) ────────────────────────────

const DEFAULT_STYLE_PERMISSIONS: Record<StyleMode, Partial<Record<VisualStyle, StylePermission>>> = {
  brand_native: {
    quiet_luxury: "allowed",
    hyper_clean_tech: "allowed",
    editorial_fashion: "allowed",
    organic_earthy: "allowed",
    vibrant_street: "allowed",
    gritty_industrial: "allowed",
    dreamcore: "allowed",
    pop_high_saturation: "allowed",
  },
  brand_adjacent: {
    quiet_luxury: "allowed",
    hyper_clean_tech: "allowed",
    editorial_fashion: "allowed",
    organic_earthy: "allowed",
    vibrant_street: "allowed",
    gritty_industrial: "stretch",
    dreamcore: "stretch",
    pop_high_saturation: "allowed",
  },
  stretch: {
    quiet_luxury: "stretch",
    hyper_clean_tech: "stretch",
    editorial_fashion: "stretch",
    organic_earthy: "stretch",
    vibrant_street: "stretch",
    gritty_industrial: "stretch",
    dreamcore: "stretch",
    pop_high_saturation: "stretch",
  },
};

export const DEFAULT_BRAND_POLICY: BrandStylePolicy = {
  brand_name: "default",
  style_permissions: DEFAULT_STYLE_PERMISSIONS,
  preferred_render_families: ["photo_led", "hybrid", "design_led"],
  human_presence_allowed: ["none", "hand", "face", "body"],
  max_stretch_per_batch: 2,
  color_constraints: {
    require_brand_primary: false,
    forbidden_backgrounds: [],
    allow_neon: true,
  },
  product_constraints: {
    require_product_visible: true,
    min_product_scale: 0.15,
    allow_occlusion: true,
    require_exact_packaging: false,
  },
  copy_constraints: {
    max_headline_chars: 40,
    forbidden_cta_words: ["acheter maintenant", "buy now", "cliquez ici"],
    tone_rules: [],
  },
};

// ─── Policy inference from FilteredContext ───────────────────

/**
 * Infer a brand style policy from the filtered context.
 * Uses the visual tone and brand codes to determine permissions.
 * In the future, this can be overridden per-brand from DB.
 */
export function inferBrandPolicy(context: FilteredContext): BrandStylePolicy {
  const tone = context.brand_visual_code.visual_tone.toLowerCase();
  const policy = structuredClone(DEFAULT_BRAND_POLICY);
  policy.brand_name = context.brand_name;

  // ── Tone-based policy adjustments ──

  if (tone.includes("luxe") || tone.includes("luxury") || tone.includes("premium") || tone.includes("haut de gamme")) {
    // Luxury brands: restrict to refined styles
    policy.style_permissions.brand_native = {
      quiet_luxury: "allowed",
      hyper_clean_tech: "allowed",
      editorial_fashion: "allowed",
      organic_earthy: "stretch",
      vibrant_street: "forbidden",
      gritty_industrial: "forbidden",
      dreamcore: "forbidden",
      pop_high_saturation: "forbidden",
    };
    policy.style_permissions.brand_adjacent = {
      quiet_luxury: "allowed",
      hyper_clean_tech: "allowed",
      editorial_fashion: "allowed",
      organic_earthy: "allowed",
      vibrant_street: "stretch",
      gritty_industrial: "forbidden",
      dreamcore: "stretch",
      pop_high_saturation: "forbidden",
    };
    policy.max_stretch_per_batch = 1;
    policy.color_constraints.allow_neon = false;
    policy.product_constraints.min_product_scale = 0.2;
    policy.product_constraints.allow_occlusion = false;
    policy.copy_constraints.max_headline_chars = 30;
  }

  if (tone.includes("naturel") || tone.includes("bio") || tone.includes("organic") || tone.includes("eco")) {
    // Eco/natural brands: prefer earthy, reject industrial
    policy.style_permissions.brand_native = {
      quiet_luxury: "allowed",
      hyper_clean_tech: "stretch",
      editorial_fashion: "allowed",
      organic_earthy: "allowed",
      vibrant_street: "stretch",
      gritty_industrial: "forbidden",
      dreamcore: "stretch",
      pop_high_saturation: "stretch",
    };
    policy.color_constraints.allow_neon = false;
    policy.preferred_render_families = ["photo_led", "hybrid", "design_led"];
  }

  if (tone.includes("fun") || tone.includes("playful") || tone.includes("bold") || tone.includes("audacieux")) {
    // Fun/bold brands: open to vibrant and stretch
    policy.style_permissions.brand_native = {
      quiet_luxury: "stretch",
      hyper_clean_tech: "allowed",
      editorial_fashion: "allowed",
      organic_earthy: "stretch",
      vibrant_street: "allowed",
      gritty_industrial: "stretch",
      dreamcore: "allowed",
      pop_high_saturation: "allowed",
    };
    policy.max_stretch_per_batch = 3;
    policy.color_constraints.allow_neon = true;
    policy.copy_constraints.max_headline_chars = 50;
  }

  if (tone.includes("tech") || tone.includes("modern") || tone.includes("minimal")) {
    // Tech/minimal brands: clean + tech focus
    policy.style_permissions.brand_native = {
      quiet_luxury: "allowed",
      hyper_clean_tech: "allowed",
      editorial_fashion: "stretch",
      organic_earthy: "forbidden",
      vibrant_street: "stretch",
      gritty_industrial: "stretch",
      dreamcore: "stretch",
      pop_high_saturation: "stretch",
    };
    policy.preferred_render_families = ["design_led", "hybrid", "photo_led"];
    policy.product_constraints.require_exact_packaging = true;
  }

  return policy;
}

// ─── Policy validation helpers ──────────────────────────────

/**
 * Check if a style mode + visual style combo is allowed by policy.
 */
export function isStyleAllowed(
  policy: BrandStylePolicy,
  styleMode: StyleMode,
  visualStyle: VisualStyle
): StylePermission {
  return policy.style_permissions[styleMode]?.[visualStyle] ?? "allowed";
}

/**
 * Check if a concept violates the brand policy.
 * Returns list of violations (empty = OK).
 */
export function checkPolicyViolations(
  policy: BrandStylePolicy,
  concept: {
    style_mode: StyleMode;
    visual_style: VisualStyle;
    render_family: RenderFamily;
    human_presence: HumanPresence;
    product_role: string;
    headline?: string;
    cta?: string;
  }
): string[] {
  const violations: string[] = [];

  // Check style permission
  const permission = isStyleAllowed(policy, concept.style_mode, concept.visual_style);
  if (permission === "forbidden") {
    violations.push(
      `Style "${concept.visual_style}" is FORBIDDEN in mode "${concept.style_mode}" for brand "${policy.brand_name}"`
    );
  }

  // Check human presence
  if (!policy.human_presence_allowed.includes(concept.human_presence)) {
    violations.push(
      `Human presence "${concept.human_presence}" is not allowed for brand "${policy.brand_name}"`
    );
  }

  // Check product visibility
  if (policy.product_constraints.require_product_visible && concept.product_role === "absent") {
    violations.push(
      `Product must be visible for brand "${policy.brand_name}" but product_role is "absent"`
    );
  }

  // Check headline length
  if (concept.headline && concept.headline.length > policy.copy_constraints.max_headline_chars) {
    violations.push(
      `Headline too long: ${concept.headline.length} chars (max: ${policy.copy_constraints.max_headline_chars})`
    );
  }

  // Check CTA forbidden words
  if (concept.cta) {
    const ctaLower = concept.cta.toLowerCase();
    for (const forbidden of policy.copy_constraints.forbidden_cta_words) {
      if (ctaLower.includes(forbidden.toLowerCase())) {
        violations.push(`CTA contains forbidden word: "${forbidden}"`);
      }
    }
  }

  return violations;
}

/**
 * Count how many stretch concepts are in a batch.
 */
export function countStretchInBatch(
  policy: BrandStylePolicy,
  concepts: Array<{ style_mode: StyleMode; visual_style: VisualStyle }>
): number {
  return concepts.filter((c) => {
    const permission = isStyleAllowed(policy, c.style_mode, c.visual_style);
    return permission === "stretch";
  }).length;
}

/**
 * Format the policy as a string for Claude prompts.
 */
export function formatPolicyForPrompt(policy: BrandStylePolicy): string {
  const lines: string[] = [
    `=== BRAND STYLE POLICY: "${policy.brand_name}" ===`,
    "",
    "STYLE PERMISSIONS (brand_native):",
  ];

  for (const [style, permission] of Object.entries(policy.style_permissions.brand_native)) {
    lines.push(`  ${style}: ${permission}`);
  }

  lines.push("");
  lines.push(`Render families (préférence): ${policy.preferred_render_families.join(" > ")}`);
  lines.push(`Human presence autorisée: ${policy.human_presence_allowed.join(", ")}`);
  lines.push(`Max stretch par batch: ${policy.max_stretch_per_batch}`);
  lines.push(`Headline max: ${policy.copy_constraints.max_headline_chars} chars`);
  lines.push(`Produit visible obligatoire: ${policy.product_constraints.require_product_visible ? "OUI" : "NON"}`);

  if (policy.copy_constraints.tone_rules.length > 0) {
    lines.push(`Ton: ${policy.copy_constraints.tone_rules.join(", ")}`);
  }

  if (policy.color_constraints.forbidden_backgrounds.length > 0) {
    lines.push(`Fonds interdits: ${policy.color_constraints.forbidden_backgrounds.join(", ")}`);
  }

  return lines.join("\n");
}
