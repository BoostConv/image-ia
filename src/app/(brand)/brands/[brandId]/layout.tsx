export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import { BrandSidebar } from "@/components/layout/brand-sidebar";

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);

  if (!brand) notFound();

  return (
    <div className="flex h-screen overflow-hidden">
      <BrandSidebar
        brandId={brand.id}
        brandName={brand.name}
        brandColor={brand.colorPalette?.primary}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
