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
  X,
  Copy,
  FileText,
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
  compiledPrompt: string | null;
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
  const [detailImage, setDetailImage] = useState<LibraryImage | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
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
              onClick={() => setDetailImage(img)}
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
                <div
                  className={`absolute top-2 left-2 rounded-md p-1 transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-black/30 text-white opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={(e) => toggleSelect(e, img.id)}
                >
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
                {/* Prompt indicator */}
                {img.compiledPrompt && (
                  <div className="absolute bottom-2 right-2 rounded-md bg-black/40 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5">
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
                {/* Prompt preview */}
                {img.compiledPrompt && (
                  <p className="text-[10px] leading-tight text-muted-foreground line-clamp-3">
                    {img.compiledPrompt}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Image Detail Modal ─────────────────────────────────── */}
      {detailImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailImage(null)}
        >
          <div
            className="relative bg-background rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setDetailImage(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image */}
            <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-[500px] bg-muted">
              <Image
                src={`/api/images/${encodeURIComponent(detailImage.filePath)}`}
                alt="Visuel genere"
                fill
                className="object-contain"
                sizes="50vw"
              />
            </div>

            {/* Details panel */}
            <div className="w-full md:w-1/2 p-5 overflow-y-auto space-y-4">
              <h3 className="text-lg font-semibold">Details du visuel</h3>

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {detailImage.format && (
                    <Badge variant="outline" className="text-xs">
                      {detailImage.format}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      detailImage.status === "approved"
                        ? "default"
                        : detailImage.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {detailImage.status === "approved"
                      ? "Valide"
                      : detailImage.status === "rejected"
                        ? "Refuse"
                        : "En attente"}
                  </Badge>
                  {detailImage.scoreData?.overall && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        detailImage.scoreData.overall >= 7 ? "border-green-500 text-green-700" :
                        detailImage.scoreData.overall >= 4 ? "border-amber-500 text-amber-700" :
                        "border-red-500 text-red-700"
                      }`}
                    >
                      Score: {detailImage.scoreData.overall}/10
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {new Date(detailImage.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Tags */}
              {detailImage.tags && detailImage.tags.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {detailImage.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt */}
              {detailImage.compiledPrompt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Prompt utilise
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => copyPrompt(detailImage.compiledPrompt!)}
                    >
                      {copiedPrompt ? (
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedPrompt ? "Copie !" : "Copier"}
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                      {detailImage.compiledPrompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = `/api/images/${encodeURIComponent(detailImage.filePath)}`;
                    a.download = `visuel_${detailImage.id}.png`;
                    a.click();
                  }}
                >
                  <Download className="h-3 w-3 mr-1.5" />
                  Telecharger
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
