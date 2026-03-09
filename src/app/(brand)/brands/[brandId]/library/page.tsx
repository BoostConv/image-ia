export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandImages } from "@/lib/db/queries/generations";
import { Card } from "@/components/ui/card";
import { Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { LibraryClient } from "@/components/library/library-client";

export default async function BrandLibraryPage({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bibliotheque</h1>
          <p className="text-sm text-muted-foreground">
            Visuels generes pour {brand.name}
          </p>
        </div>
        <Badge variant="outline">{images.length} visuels</Badge>
      </div>

      {images.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Images className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Bibliotheque vide
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Generez vos premiers visuels pour {brand.name}
          </p>
          <LinkButton href={`/brands/${brandId}/generate`}>
            Generer des visuels
          </LinkButton>
        </Card>
      ) : (
        <LibraryClient
          brandId={brandId}
          brandName={brand.name}
          images={images.map((img) => ({
            id: img.id,
            filePath: img.filePath,
            format: img.format,
            status: img.status,
            tags: img.tags,
            createdAt: img.createdAt,
            scoreData: img.scoreData,
            compiledPrompt: img.compiledPrompt || null,
          }))}
        />
      )}
    </div>
  );
}
