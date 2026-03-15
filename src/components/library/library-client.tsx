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
  Trash2,
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
} from "lucide-react";
import { ReviewButtons, type ReviewVerdict } from "@/components/reviews/review-buttons";
import { ReviewModal } from "@/components/reviews/review-modal";

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
  lastVerdict: string | null;
  geminiSystemInstruction: string | null;
  geminiEditPrompt: string | null;
  claudeSystemPrompt: string | null;
  claudeUserPrompt: string | null;
}

interface LibraryClientProps {
  brandId: string;
  brandName: string;
  images: LibraryImage[];
}

const verdictBadgeConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Valide", className: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "Refuse", className: "bg-red-500", icon: XCircle },
  revision: { label: "Correction", className: "bg-amber-500", icon: Pencil },
  variant: { label: "Variant", className: "bg-blue-500", icon: Copy },
};

export function LibraryClient({ brandId, brandName, images: initialImages }: LibraryClientProps) {
  const [images, setImages] = useState(initialImages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);
  const [galleryLink, setGalleryLink] = useState<string | null>(null);
  const [expandedPromptSection, setExpandedPromptSection] = useState<string | null>(null);
  const [galleryName, setGalleryName] = useState("");
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [detailImage, setDetailImage] = useState<LibraryImage | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  // Review state
  const [reviewModal, setReviewModal] = useState<{ open: boolean; verdict: ReviewVerdict | null }>({
    open: false,
    verdict: null,
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  // Track local verdict overrides
  const [localVerdicts, setLocalVerdicts] = useState<Map<string, string>>(new Map());

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDelete(false);
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

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/images/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, confirmDelete]);

  const handleDeleteSingle = useCallback(async (imageId: string) => {
    try {
      const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setDetailImage(null);
      }
    } catch {
      // silently fail
    }
  }, []);

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

  const handleReviewClick = (verdict: ReviewVerdict) => {
    setReviewModal({ open: true, verdict });
  };

  const handleReviewSubmit = useCallback(async (comment: string) => {
    if (!detailImage || !reviewModal.verdict) return;
    setReviewSubmitting(true);
    try {
      // 1. Create review
      const reviewRes = await fetch(`/api/images/${detailImage.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: reviewModal.verdict,
          comment: comment || undefined,
        }),
      });

      if (!reviewRes.ok) return;
      const { id: reviewId } = await reviewRes.json();

      // 2. Trigger regeneration or variant if needed
      if (reviewModal.verdict === "revision" && comment) {
        await fetch(`/api/images/${detailImage.id}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: comment, reviewId }),
        });
      } else if (reviewModal.verdict === "variant" && comment) {
        await fetch(`/api/images/${detailImage.id}/variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: comment, reviewId }),
        });
      }

      // 3. Update local state
      setLocalVerdicts((prev) => new Map(prev).set(detailImage.id, reviewModal.verdict!));

      // Update image status locally
      if (reviewModal.verdict !== "variant") {
        const statusMap: Record<string, string> = {
          approved: "approved",
          rejected: "rejected",
          revision: "pending",
        };
        const newStatus = statusMap[reviewModal.verdict] || "pending";
        setImages((prev) =>
          prev.map((img) =>
            img.id === detailImage.id ? { ...img, status: newStatus, lastVerdict: reviewModal.verdict } : img
          )
        );
        setDetailImage((prev) =>
          prev ? { ...prev, status: newStatus, lastVerdict: reviewModal.verdict } : null
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.id === detailImage.id ? { ...img, lastVerdict: reviewModal.verdict } : img
          )
        );
        setDetailImage((prev) =>
          prev ? { ...prev, lastVerdict: reviewModal.verdict } : null
        );
      }

      setReviewModal({ open: false, verdict: null });
    } catch {
      // silently fail
    } finally {
      setReviewSubmitting(false);
    }
  }, [detailImage, reviewModal.verdict]);

  const getImageVerdict = (img: LibraryImage): string | null => {
    return localVerdicts.get(img.id) || img.lastVerdict;
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

            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="text-xs"
            >
              {isDeleting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {confirmDelete
                ? `Confirmer (${selectedIds.size})`
                : `Supprimer (${selectedIds.size})`}
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
          const verdict = getImageVerdict(img);
          const vConfig = verdict ? verdictBadgeConfig[verdict] : null;
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
                {/* Verdict badge on card */}
                {vConfig && (
                  <div className={`absolute top-2 right-2 rounded-full p-1 ${vConfig.className}`}>
                    <vConfig.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                {/* Score badge (only if no verdict badge) */}
                {!vConfig && img.scoreData?.overall && (
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

              {/* Review buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Review
                </label>
                <ReviewButtons
                  existingVerdict={getImageVerdict(detailImage)}
                  onReview={handleReviewClick}
                />
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

              {/* Prompts */}
              {(detailImage.compiledPrompt || detailImage.claudeSystemPrompt) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Prompts
                  </label>

                  {/* Gemini User Prompt (brief creatif) */}
                  {detailImage.compiledPrompt && (
                    <div>
                      <button
                        onClick={() => setExpandedPromptSection(expandedPromptSection === "gemini_user" ? null : "gemini_user")}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 w-full text-left"
                      >
                        <Sparkles className="h-3 w-3" />
                        Gemini — Brief creatif
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] ml-auto"
                          onClick={(e) => { e.stopPropagation(); copyPrompt(detailImage.compiledPrompt!); }}
                        >
                          {copiedPrompt ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                        </Button>
                        {expandedPromptSection === "gemini_user" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {expandedPromptSection === "gemini_user" && (
                        <pre className="mt-1 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-[10px] leading-relaxed text-blue-900 dark:text-blue-200 max-h-[250px] overflow-y-auto whitespace-pre-wrap break-words">
                          {detailImage.compiledPrompt}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Gemini System Instruction */}
                  {detailImage.geminiSystemInstruction && (
                    <div>
                      <button
                        onClick={() => setExpandedPromptSection(expandedPromptSection === "gemini_sys" ? null : "gemini_sys")}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 w-full text-left"
                      >
                        <Sparkles className="h-3 w-3" />
                        Gemini — System Instruction
                        {expandedPromptSection === "gemini_sys" ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                      </button>
                      {expandedPromptSection === "gemini_sys" && (
                        <pre className="mt-1 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-[10px] leading-relaxed text-blue-900 dark:text-blue-200 max-h-[250px] overflow-y-auto whitespace-pre-wrap break-words">
                          {detailImage.geminiSystemInstruction}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Gemini Pass 2 Edit */}
                  {detailImage.geminiEditPrompt && (
                    <div>
                      <button
                        onClick={() => setExpandedPromptSection(expandedPromptSection === "gemini_edit" ? null : "gemini_edit")}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 w-full text-left"
                      >
                        <Sparkles className="h-3 w-3" />
                        Gemini — Pass 2 (edit)
                        {expandedPromptSection === "gemini_edit" ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                      </button>
                      {expandedPromptSection === "gemini_edit" && (
                        <pre className="mt-1 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-[10px] leading-relaxed text-blue-900 dark:text-blue-200 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">
                          {detailImage.geminiEditPrompt}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Claude System Prompt */}
                  {detailImage.claudeSystemPrompt && (
                    <div>
                      <button
                        onClick={() => setExpandedPromptSection(expandedPromptSection === "claude_sys" ? null : "claude_sys")}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-400 w-full text-left"
                      >
                        <Brain className="h-3 w-3" />
                        Claude — System Prompt
                        {expandedPromptSection === "claude_sys" ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                      </button>
                      {expandedPromptSection === "claude_sys" && (
                        <pre className="mt-1 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-[10px] leading-relaxed text-purple-900 dark:text-purple-200 max-h-[250px] overflow-y-auto whitespace-pre-wrap break-words">
                          {detailImage.claudeSystemPrompt}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Claude User Prompt */}
                  {detailImage.claudeUserPrompt && (
                    <div>
                      <button
                        onClick={() => setExpandedPromptSection(expandedPromptSection === "claude_user" ? null : "claude_user")}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-400 w-full text-left"
                      >
                        <Brain className="h-3 w-3" />
                        Claude — User Prompt
                        {expandedPromptSection === "claude_user" ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                      </button>
                      {expandedPromptSection === "claude_user" && (
                        <pre className="mt-1 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-[10px] leading-relaxed text-purple-900 dark:text-purple-200 max-h-[250px] overflow-y-auto whitespace-pre-wrap break-words">
                          {detailImage.claudeUserPrompt}
                        </pre>
                      )}
                    </div>
                  )}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Supprimer ce visuel ?")) {
                      handleDeleteSingle(detailImage.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && reviewModal.verdict && (
        <ReviewModal
          verdict={reviewModal.verdict}
          onConfirm={handleReviewSubmit}
          onCancel={() => setReviewModal({ open: false, verdict: null })}
          submitting={reviewSubmitting}
        />
      )}
    </div>
  );
}
