"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Images, CheckCircle, XCircle, Trash2 } from "lucide-react";

interface BrandWithStats {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  colorPalette: { primary: string; secondary: string; accent: string } | null;
  stats: { total: number; approved: number; rejected: number };
}

export function BrandCardGrid({ brands }: { brands: BrandWithStats[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/brands", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erreur suppression");
      router.refresh();
    } catch (error) {
      console.error("Delete brand error:", error);
      alert("Erreur lors de la suppression de la marque");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <div key={brand.id} className="relative group">
          <Link href={`/brands/${brand.id}/generate`}>
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

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${
              confirmId === brand.id
                ? "opacity-100 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
            }`}
            disabled={deletingId === brand.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(brand.id, brand.name);
            }}
            title={confirmId === brand.id ? "Cliquer pour confirmer" : "Supprimer la marque"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Confirmation label */}
          {confirmId === brand.id && (
            <div
              className="absolute top-2 right-11 bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmId(null);
              }}
            >
              {deletingId === brand.id ? "Suppression..." : "Confirmer ?"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
