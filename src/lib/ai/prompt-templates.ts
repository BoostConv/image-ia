import type { AspectRatio, FormatPreset } from "./types";

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: "feed_square",
    label: "Carre",
    description: "Feed Instagram/Facebook 1:1",
    aspectRatio: "1:1",
    icon: "Square",
  },
  {
    id: "story_reels",
    label: "9:16",
    description: "Story / Reels plein ecran",
    aspectRatio: "9:16",
    icon: "Smartphone",
  },
  {
    id: "feed_portrait",
    label: "4:5",
    description: "Feed portrait Instagram",
    aspectRatio: "4:5",
    icon: "RectangleVertical",
  },
  {
    id: "feed_landscape",
    label: "16:9",
    description: "Paysage Facebook/LinkedIn",
    aspectRatio: "16:9",
    icon: "RectangleHorizontal",
  },
];

export const FORMAT_TEMPLATES: Record<string, string> = {
  feed_square:
    "Format carre (1:1). Optimise pour le feed Instagram/Facebook. Sujet centre, composition equilibree. Bords nets.",
  story_reels:
    "Format vertical plein ecran (9:16). Mobile-first, accrocheur et impactant. Zones de texte protegees en haut et en bas (20%).",
  feed_portrait:
    "Format portrait (4:5). Optimise pour le feed Instagram. Composition verticale, le sujet remplit le cadre.",
  feed_landscape:
    "Format paysage (16:9). Optimise pour Facebook/LinkedIn. Composition large et aeree.",
};

export const FORMAT_TO_ASPECT_RATIO: Record<string, AspectRatio> = {
  feed_square: "1:1",
  story_reels: "9:16",
  feed_portrait: "4:5",
  feed_landscape: "16:9",
};
