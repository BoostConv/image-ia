export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { BrandRulesEditor } from "@/components/brand/brand-rules-editor";

export default async function BrandRulesPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Regles IA</h1>
        <p className="text-sm text-muted-foreground">
          Contraintes respectees par l'IA a chaque generation pour {brand.name}
        </p>
      </div>

      <BrandRulesEditor brandId={brandId} initialRules={brand.brandRules ?? null} />
    </div>
  );
}
