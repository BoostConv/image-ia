export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandImages } from "@/lib/db/queries/generations";
import { Card } from "@/components/ui/card";
import { Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { LibraryClient } from "@/components/library/library-client";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function getLatestVerdicts(imageIds: string[]): Promise<Map<string, string>> {
  if (imageIds.length === 0) return new Map();
  const allReviews = await db
    .select({ imageId: reviews.imageId, verdict: reviews.verdict, createdAt: reviews.createdAt })
    .from(reviews)
    .orderBy(desc(reviews.createdAt));
  // Keep only the latest review per image
  const map = new Map<string, string>();
  const imageIdSet = new Set(imageIds);
  for (const r of allReviews) {
    if (imageIdSet.has(r.imageId) && !map.has(r.imageId)) {
      map.set(r.imageId, r.verdict);
    }
  }
  return map;
}

export default async function BrandLibraryPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const images = await getBrandImages(brandId);
  const verdicts = await getLatestVerdicts(images.map((img) => img.id));

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
          images={images.map((img) => {
            const cd = img.creativeData as Record<string, unknown> | null;
            const promptUsed = (cd?.prompt_used as string) || null;
            const brief = cd?.brief as Record<string, unknown> | null;
            const visualIdea = (brief?.single_visual_idea as string) || null;
            return {
              id: img.id,
              filePath: img.filePath,
              format: img.format,
              status: img.status,
              tags: img.tags,
              createdAt: img.createdAt,
              scoreData: img.scoreData,
              compiledPrompt: promptUsed || visualIdea || img.compiledPrompt || null,
              lastVerdict: verdicts.get(img.id) || null,
              geminiSystemInstruction: (cd?.gemini_system_instruction as string) || null,
              geminiEditPrompt: (cd?.gemini_edit_prompt as string) || null,
              claudeSystemPrompt: (cd?.claude_system_prompt as string) || null,
              claudeUserPrompt: (cd?.claude_user_prompt as string) || null,
            };
          })}
        />
      )}
    </div>
  );
}
