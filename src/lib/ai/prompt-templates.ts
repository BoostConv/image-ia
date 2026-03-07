import type { AspectRatio, FormatPreset } from "./types";

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: "feed_square",
    label: "Feed Carre",
    description: "Instagram/Facebook feed 1:1",
    aspectRatio: "1:1",
    icon: "Square",
  },
  {
    id: "feed_portrait",
    label: "Feed Portrait",
    description: "Instagram feed 4:5",
    aspectRatio: "4:5",
    icon: "RectangleVertical",
  },
  {
    id: "feed_landscape",
    label: "Feed Paysage",
    description: "Facebook/LinkedIn 16:9",
    aspectRatio: "16:9",
    icon: "RectangleHorizontal",
  },
  {
    id: "story_reels",
    label: "Story / Reels",
    description: "Plein ecran mobile 9:16",
    aspectRatio: "9:16",
    icon: "Smartphone",
  },
  {
    id: "hero_banner",
    label: "Hero Banner",
    description: "Banniere site web 21:9",
    aspectRatio: "21:9",
    icon: "Monitor",
  },
  {
    id: "product_white",
    label: "Produit Fond Blanc",
    description: "Photo produit e-commerce",
    aspectRatio: "1:1",
    icon: "Package",
  },
  {
    id: "product_lifestyle",
    label: "Produit Lifestyle",
    description: "Produit en situation",
    aspectRatio: "3:2",
    icon: "Camera",
  },
  {
    id: "product_ambiance",
    label: "Produit Ambiance",
    description: "Ambiance atmospherique",
    aspectRatio: "3:2",
    icon: "Sparkles",
  },
];

export const FORMAT_TEMPLATES: Record<string, string> = {
  feed_square:
    "Format carre (1:1). Optimise pour le feed Instagram/Facebook. Sujet centre, composition equilibree. Bords nets.",
  feed_portrait:
    "Format portrait (4:5). Optimise pour le feed Instagram. Composition verticale, le sujet remplit le cadre.",
  feed_landscape:
    "Format paysage (16:9). Optimise pour Facebook/LinkedIn. Composition large et aeree.",
  story_reels:
    "Format vertical plein ecran (9:16). Mobile-first, accrocheur et impactant. Zones de texte protegees en haut et en bas (20%).",
  hero_banner:
    "Format ultra-large (21:9). Banniere hero de site web. Composition dramatique avec espace pour du texte en surimpression.",
  product_white:
    "Photo produit sur fond blanc pur (#FFFFFF). Clean, commercial, sujet centre. Eclairage doux et uniforme, pas d'ombres portees.",
  product_lifestyle:
    "Produit en contexte lifestyle. Decor naturel, lumiere chaude, scene stylee. Le produit est le heros mais l'environnement raconte une histoire.",
  product_ambiance:
    "Photo produit atmospherique. Eclairage dramatique, ambiance forte. Textures riches et profondeur de champ.",
};

export const FORMAT_TO_ASPECT_RATIO: Record<string, AspectRatio> = {
  feed_square: "1:1",
  feed_portrait: "4:5",
  feed_landscape: "16:9",
  story_reels: "9:16",
  hero_banner: "21:9",
  product_white: "1:1",
  product_lifestyle: "3:2",
  product_ambiance: "3:2",
};
