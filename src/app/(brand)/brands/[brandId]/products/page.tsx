export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById, getBrandProducts, getBrandPersonas } from "@/lib/db/queries/brands";
import { Separator } from "@/components/ui/separator";
import { ProductManager } from "@/components/brand/product-manager";
import { PersonaManager } from "@/components/brand/persona-manager";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const [products, personas] = await Promise.all([
    getBrandProducts(brandId),
    getBrandPersonas(brandId),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Produits & Personas</h1>
        <p className="text-sm text-muted-foreground">
          Gerez les produits, personas et angles marketing de {brand.name}
        </p>
      </div>

      <ProductManager brandId={brandId} initialProducts={products} personas={personas} />

      <Separator />

      <PersonaManager brandId={brandId} initialPersonas={personas} />
    </div>
  );
}
