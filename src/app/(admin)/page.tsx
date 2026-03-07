import Link from "next/link";
import { getAllBrands } from "@/lib/db/queries/brands";
import { getBrandImageStats } from "@/lib/db/queries/generations";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Palette, Images, CheckCircle, XCircle } from "lucide-react";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brandsWithStats.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.id}/generate`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {brand.colorPalette ? (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: brand.colorPalette.primary }}
                      >
                        <span className="text-white font-bold text-sm">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Palette className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{brand.name}</CardTitle>
                      {brand.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {brand.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {brand.colorPalette && (
                    <div className="flex gap-1 mb-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: brand.colorPalette.primary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: brand.colorPalette.secondary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: brand.colorPalette.accent }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Images className="h-3 w-3" />
                      {brand.stats.total} visuels
                    </span>
                    {brand.stats.approved > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {brand.stats.approved}
                      </span>
                    )}
                    {brand.stats.rejected > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-3 w-3" />
                        {brand.stats.rejected}
                      </span>
                    )}
                  </div>
                  {brand.websiteUrl && (
                    <p className="text-[10px] text-muted-foreground/60 mt-2 truncate">
                      {brand.websiteUrl}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
