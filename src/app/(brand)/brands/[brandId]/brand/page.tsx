export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandDocuments } from "@/lib/db/queries/documents";
import { Separator } from "@/components/ui/separator";
import { BrandIdentityEditor } from "@/components/brand/brand-identity-editor";
import { BrandDocumentsClient } from "@/components/brand/brand-settings-client";
import { BrandDAClient } from "@/components/brand/brand-da-client";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const documents = await getBrandDocuments(brandId);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Identite de marque</h1>
        <p className="text-sm text-muted-foreground">
          Logo, couleurs, typographie et strategie de {brand.name}
        </p>
      </div>

      <BrandIdentityEditor
        brand={{
          id: brand.id,
          name: brand.name,
          description: brand.description,
          logoPath: brand.logoPath,
          mission: brand.mission,
          vision: brand.vision,
          positioning: brand.positioning,
          tone: brand.tone,
          values: brand.values,
          targetMarket: brand.targetMarket,
          websiteUrl: brand.websiteUrl,
          instagramHandle: brand.instagramHandle,
          facebookPageUrl: brand.facebookPageUrl,
          colorPalette: brand.colorPalette,
          typography: brand.typography,
        }}
      />

      <Separator />

      <BrandDAClient
        brandId={brandId}
        initialImages={brand.brandStyleImages || []}
        initialFingerprint={brand.daFingerprint as any}
      />

      <Separator />

      <BrandDocumentsClient brandId={brandId} initialDocuments={documents} />
    </div>
  );
}
