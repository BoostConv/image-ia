export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById, getBrandProducts, getBrandPersonas } from "@/lib/db/queries/brands";
import { getActiveGuidelines, compileGuidelinesPrompt } from "@/lib/db/queries/guidelines";
import { compileDocumentsPrompt, compileInspirationPrompt } from "@/lib/db/queries/documents";
import { BrandGenerateClient } from "@/components/generate/brand-generate-client";

export default async function BrandGeneratePage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const [products, personas, guidelinesPrompt, activeGuidelines, documentsPrompt, inspirationPrompt] = await Promise.all([
    getBrandProducts(brandId),
    getBrandPersonas(brandId),
    compileGuidelinesPrompt(brandId),
    getActiveGuidelines(brandId),
    compileDocumentsPrompt(brandId),
    compileInspirationPrompt(brandId),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Generer des visuels</h1>
        <p className="text-sm text-muted-foreground">
          Creez des visuels IA pour {brand.name}
        </p>
      </div>
      <BrandGenerateClient
        brand={brand}
        products={products}
        personas={personas}
        guidelinesPrompt={guidelinesPrompt}
        guidelinesCount={activeGuidelines.length}
        documentsPrompt={documentsPrompt}
        inspirationPrompt={inspirationPrompt}
      />
    </div>
  );
}
