export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { getBrandInspirationAds } from "@/lib/db/queries/documents";
import { BrandInspirationsClient } from "@/components/brand/brand-settings-client";

export default async function InspirationsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  const inspirationAds = await getBrandInspirationAds(brandId);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Inspirations</h1>
        <p className="text-sm text-muted-foreground">
          Ads de reference et inspirations publicitaires pour {brand.name}
        </p>
      </div>

      <BrandInspirationsClient brandId={brandId} initialInspirationAds={inspirationAds} />
    </div>
  );
}
