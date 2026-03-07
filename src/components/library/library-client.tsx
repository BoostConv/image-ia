"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Share2,
  CheckSquare,
  Square,
  Loader2,
  Link2,
  Check,
} from "lucide-react";

interface LibraryImage {
  id: string;
  filePath: string;
  format: string | null;
  status: string | null;
  tags: string[] | null;
  createdAt: string;
  scoreData: {
    overall: number;
  } | null;
}

interface LibraryClientProps {
  brandId: string;
  brandName: string;
  images: LibraryImage[];
}

export function LibraryClient({ brandId, brandName, images }: LibraryClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);
  const [galleryLink, setGalleryLink] = useState<string | null>(null);
  const [galleryName, setGalleryName] = useState("");
  const [showGalleryForm, setShowGalleryForm] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)));
    }
  };

  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageIds: Array.from(selectedIds),
          brandId,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "export.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds, brandId]);

  const handleCreateGallery = useCallback(async () => {
    if (selectedIds.size === 0 || !galleryName.trim()) return;
    setIsCreatingGallery(true);
    try {
      const res = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          name: galleryName,
          imageIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGalleryLink(`${window.location.origin}/share/${data.shareToken}`);
        setShowGalleryForm(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsCreatingGallery(false);
    }
  }, [selectedIds, brandId, galleryName]);

  const copyLink = () => {
    if (galleryLink) {
      navigator.clipboard.writeText(galleryLink);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
          {selectedIds.size === images.length ? (
            <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Square className="mr-1.5 h-3.5 w-3.5" />
          )}
          {selectedIds.size > 0 ? `${selectedIds.size} selectionne(s)` : "Tout selectionner"}
        </Button>

        {selectedIds.size > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="text-xs"
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              Exporter ZIP
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGalleryForm(!showGalleryForm)}
              className="text-xs"
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Creer galerie
            </Button>
          </>
        )}
      </div>

      {/* Gallery creation form */}
      {showGalleryForm && (
        <Card className="p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              placeholder="Nom de la galerie..."
              className="flex-1 rounded-md border px-2.5 py-1.5 text-sm bg-background"
              onKeyDown={(e) => e.key === "Enter" && handleCreateGallery()}
            />
            <Button
              size="sm"
              onClick={handleCreateGallery}
              disabled={!galleryName.trim() || isCreatingGallery}
            >
              {isCreatingGallery ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Creer"
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {selectedIds.size} visuels seront partages via un lien public
          </p>
        </Card>
      )}

      {/* Gallery link */}
      {galleryLink && (
        <Card className="p-3 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-green-600 shrink-0" />
            <code className="flex-1 text-xs font-mono truncate text-green-700">
              {galleryLink}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyLink}
              className="shrink-0 text-xs h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Copier
            </Button>
          </div>
        </Card>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => {
          const isSelected = selectedIds.has(img.id);
          return (
            <Card
              key={img.id}
              className={`group overflow-hidden cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => toggleSelect(img.id)}
            >
              <div className="relative aspect-square">
                <Image
                  src={`/api/images/${encodeURIComponent(img.filePath)}`}
                  alt="Visuel genere"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {/* Selection checkbox */}
                <div className={`absolute top-2 left-2 rounded-md p-1 transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-black/30 text-white opacity-0 group-hover:opacity-100"
                }`}>
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
                {/* Score badge */}
                {img.scoreData?.overall && (
                  <div className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    img.scoreData.overall >= 7 ? "bg-green-500 text-white" :
                    img.scoreData.overall >= 4 ? "bg-amber-500 text-white" :
                    "bg-red-500 text-white"
                  }`}>
                    {img.scoreData.overall}/10
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {img.format && (
                    <Badge variant="outline" className="text-[10px]">
                      {img.format}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      img.status === "approved"
                        ? "default"
                        : img.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {img.status === "approved"
                      ? "Valide"
                      : img.status === "rejected"
                        ? "Refuse"
                        : "En attente"}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
