export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/db/queries/brands";
import BrandStylePolicyEditor from "@/components/brand/brand-style-policy-editor";

export default async function BrandStylePolicyPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrandById(brandId);
  if (!brand) notFound();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <BrandStylePolicyEditor
        brandId={brandId}
        initialPolicy={(brand.brandStylePolicy as Record<string, unknown>) ?? null}
      />
    </div>
  );
}
