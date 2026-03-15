export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { layoutInspirations } from "@/lib/db/schema";
import { LayoutInspirationGrid } from "./layout-grid";

const LAYOUT_FAMILIES = [
  // Éducatifs
  { id: "story_sequence", label: "Story Sequence", description: "Narration visuelle en etapes" },
  { id: "listicle", label: "Listicle", description: "Liste numerotee, items empiles" },
  { id: "annotation_callout", label: "Annotation / Callout", description: "Image avec callouts, labels" },
  { id: "flowchart", label: "Flowchart", description: "Processus, flux directionnel" },
  // Centrés Image
  { id: "hero_image", label: "Hero Image", description: "Image dominante plein cadre" },
  { id: "product_focus", label: "Product Focus", description: "Produit centre, fond clean" },
  { id: "product_in_context", label: "Product in Context", description: "Produit en scene lifestyle" },
  { id: "probleme_zoome", label: "Probleme Zoome", description: "Gros plan sur le probleme" },
  { id: "golden_hour", label: "Golden Hour", description: "Ambiance lumiere chaude" },
  { id: "macro_detail", label: "Macro Detail", description: "Gros plan extreme, texture" },
  { id: "action_shot", label: "Action Shot", description: "Produit en mouvement" },
  { id: "ingredient_showcase", label: "Ingredient Showcase", description: "Ingredients autour du produit" },
  { id: "scale_shot", label: "Scale Shot", description: "Comparaison de taille" },
  { id: "destruction_shot", label: "Destruction Shot", description: "Impact dramatique" },
  { id: "texture_fill", label: "Texture Fill", description: "Texture plein cadre" },
  { id: "negative_space", label: "Negative Space", description: "Espace vide, minimalisme" },
  // Social Proof
  { id: "testimonial_card", label: "Testimonial Card", description: "Carte temoignage, avatar + quote" },
  { id: "ugc_style", label: "UGC Style", description: "Style contenu utilisateur" },
  { id: "press_as_seen_in", label: "Press / As Seen In", description: "Logos medias, presse" },
  { id: "wall_of_love", label: "Wall of Love", description: "Mur de temoignages" },
  { id: "statistique_data_point", label: "Statistique / Data Point", description: "Chiffre cle mis en avant" },
  { id: "tweet_post_screenshot", label: "Tweet / Post Screenshot", description: "Capture post social" },
  // Comparatifs
  { id: "split_screen", label: "Split Screen", description: "50/50, comparaison cote a cote" },
  { id: "timeline_compare", label: "Timeline Compare", description: "Progression temporelle" },
  { id: "avant_apres", label: "Avant / Apres", description: "Avant-apres, transformation" },
  // Centrés Texte
  { id: "text_heavy", label: "Text Heavy", description: "Copy dominant, produit en support" },
  { id: "single_word", label: "Single Word", description: "Un mot geant, impact" },
  { id: "fill_the_blank", label: "Fill the Blank", description: "Phrase a trous interactive" },
  { id: "two_truths", label: "Two Truths", description: "Deux affirmations contrastees" },
  { id: "manifesto", label: "Manifesto", description: "Declaration de marque" },
  { id: "quote_card", label: "Quote Card", description: "Citation encadree" },
] as const;

export default async function LayoutsPage() {
  const all = await db.select().from(layoutInspirations);

  const grouped = LAYOUT_FAMILIES.map((family) => ({
    ...family,
    items: all.filter((item) => item.layoutFamily === family.id),
  }));

  const totalImages = all.length;
  const coveredFamilies = grouped.filter((g) => g.items.length > 0).length;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Layout Inspirations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalImages} visuels importes — {coveredFamilies}/31 familles couvertes
        </p>
      </div>

      <LayoutInspirationGrid groups={grouped} />
    </div>
  );
}
