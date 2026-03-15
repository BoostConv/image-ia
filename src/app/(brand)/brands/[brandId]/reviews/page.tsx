export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandGalleriesWithDetails } from "@/lib/db/queries/galleries";
import { Card } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { GalleryReviewsClient } from "@/components/reviews/gallery-reviews-client";

export default async function BrandReviewsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const galleries = await getBrandGalleriesWithDetails(brandId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Retours clients sur les galeries partagees de {brand.name}
        </p>
      </div>

      {galleries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Share2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucune galerie partagee
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Selectionnez des visuels dans la bibliotheque et creez une galerie pour les partager
          </p>
          <LinkButton href={`/brands/${brandId}/library`}>
            Aller a la bibliotheque
          </LinkButton>
        </Card>
      ) : (
        <GalleryReviewsClient galleries={galleries} />
      )}
    </div>
  );
}
