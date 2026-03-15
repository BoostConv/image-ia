import { redirect } from "next/navigation";

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  redirect(`/brands/${brandId}/brand`);
}
