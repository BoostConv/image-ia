import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandImages } from "@/lib/db/queries/generations";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { ReviewClient } from "@/components/reviews/review-client";

export default async function BrandReviewsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const images = await getBrandImages(brandId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Notez et validez les visuels de {brand.name}
        </p>
      </div>

      {images.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucun visuel a valider
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Generez des visuels puis validez-les ici
          </p>
          <LinkButton href={`/brands/${brandId}/generate`}>
            Generer des visuels
          </LinkButton>
        </Card>
      ) : (
        <ReviewClient
          brandId={brandId}
          brandName={brand.name}
          initialImages={images.map((img) => ({
            id: img.id,
            filePath: img.filePath,
            format: img.format,
            status: img.status,
            preferenceScore: img.preferenceScore,
            tags: img.tags,
            createdAt: img.createdAt,
          }))}
        />
      )}
    </div>
  );
}
