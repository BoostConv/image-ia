import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandGuidelines, getBrandKnowledge } from "@/lib/db/queries/guidelines";
import { GuidelinesClient } from "@/components/guidelines/guidelines-client";

export default async function GuidelinesPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const [guidelines, knowledge] = await Promise.all([
    getBrandGuidelines(brandId),
    getBrandKnowledge(brandId),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guidelines publicitaires</h1>
        <p className="text-sm text-muted-foreground">
          Definissez les regles pour creer les meilleures publicites statiques
          pour {brand.name}
        </p>
      </div>
      <GuidelinesClient
        brandId={brandId}
        guidelines={guidelines}
        knowledge={knowledge}
      />
    </div>
  );
}
