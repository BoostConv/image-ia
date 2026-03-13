export const dynamic = 'force-dynamic';

import { getAllBrands } from "@/lib/db/queries/brands";
import { getBrandImageStats } from "@/lib/db/queries/generations";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { BrandCardGrid } from "@/components/brand/brand-card-grid";
import { Plus, Palette } from "lucide-react";

export default async function AdminPage() {
  const brands = await getAllBrands();

  const brandsWithStats = await Promise.all(
    brands.map(async (brand) => {
      const stats = await getBrandImageStats(brand.id);
      return { ...brand, stats };
    })
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Gerez vos marques et leurs espaces de travail isoles
          </p>
        </div>
        <LinkButton href="/brands/new">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle marque
        </LinkButton>
      </div>

      {brands.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Palette className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucune marque
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Commencez par creer votre premiere marque
          </p>
          <LinkButton href="/brands/new">
            <Plus className="mr-2 h-4 w-4" />
            Creer une marque
          </LinkButton>
        </Card>
      ) : (
        <BrandCardGrid brands={brandsWithStats} />
      )}
    </div>
  );
}
