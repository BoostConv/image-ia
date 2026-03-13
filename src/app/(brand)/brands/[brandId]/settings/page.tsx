export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import {
  getBrandById,
  getBrandProducts,
  getBrandPersonas,
} from "@/lib/db/queries/brands";
import { getBrandDocuments, getBrandInspirationAds } from "@/lib/db/queries/documents";
import { Separator } from "@/components/ui/separator";
import { BrandSettingsClient } from "@/components/brand/brand-settings-client";
import { ProductManager } from "@/components/brand/product-manager";
import { PersonaManager } from "@/components/brand/persona-manager";
import { BrandIdentityEditor } from "@/components/brand/brand-identity-editor";

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const [products, personas, documents, inspirationAds] = await Promise.all([
    getBrandProducts(brandId),
    getBrandPersonas(brandId),
    getBrandDocuments(brandId),
    getBrandInspirationAds(brandId),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Parametres de {brand.name}</h1>
        <p className="text-sm text-muted-foreground">
          Identite visuelle, produits, personas, documents et inspirations
        </p>
      </div>

      {/* Brand Kit - Editable */}
      <BrandIdentityEditor
        brand={{
          id: brand.id,
          name: brand.name,
          description: brand.description,
          mission: brand.mission,
          vision: brand.vision,
          positioning: brand.positioning,
          tone: brand.tone,
          values: brand.values,
          targetMarket: brand.targetMarket,
          websiteUrl: brand.websiteUrl,
          colorPalette: brand.colorPalette,
          typography: brand.typography,
        }}
      />

      <Separator />

      {/* Products */}
      <ProductManager brandId={brandId} initialProducts={products} personas={personas} />

      <Separator />

      {/* Personas */}
      <PersonaManager brandId={brandId} initialPersonas={personas} />

      <Separator />

      {/* Documents & Inspiration */}
      <BrandSettingsClient
        brandId={brandId}
        initialDocuments={documents}
        initialInspirationAds={inspirationAds}
      />
    </div>
  );
}
