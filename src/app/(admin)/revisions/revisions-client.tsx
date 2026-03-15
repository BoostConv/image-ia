"use client";

import { useState, useMemo } from "react";
import NextImage from "next/image";
import {
  Clock,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  X,
  Palette,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RevisionRequest } from "@/lib/db/queries/revisions";

interface RevisionsClientProps {
  pending: RevisionRequest[];
  completed: RevisionRequest[];
}

interface BrandGroup {
  brandId: string;
  brandName: string;
  brandLogoPath: string | null;
  revisions: RevisionRequest[];
}

function groupByBrand(revisions: RevisionRequest[]): BrandGroup[] {
  const map = new Map<string, BrandGroup>();
  for (const r of revisions) {
    const key = r.brandId || "__unknown__";
    if (!map.has(key)) {
      map.set(key, {
        brandId: key,
        brandName: r.brandName || "Marque inconnue",
        brandLogoPath: r.brandLogoPath,
        revisions: [],
      });
    }
    map.get(key)!.revisions.push(r);
  }
  return Array.from(map.values());
}

function BrandHeader({ group }: { group: BrandGroup }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      {group.brandLogoPath ? (
        <div className="relative h-8 w-8 rounded-lg overflow-hidden border bg-white">
          <NextImage
            src={`/api/images/${encodeURIComponent(group.brandLogoPath)}`}
            alt={group.brandName}
            fill
            className="object-contain p-0.5"
            sizes="32px"
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <span className="text-xs font-bold text-muted-foreground">
            {group.brandName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <h3 className="text-sm font-semibold">{group.brandName}</h3>
      <Badge variant="secondary" className="text-[10px]">
        {group.revisions.length}
      </Badge>
    </div>
  );
}

export function RevisionsClient({ pending, completed }: RevisionsClientProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [regenModal, setRegenModal] = useState<{
    open: boolean;
    revision: RevisionRequest | null;
  }>({ open: false, revision: null });
  const [regenBrief, setRegenBrief] = useState("");
  const [regenSubmitting, setRegenSubmitting] = useState(false);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const pendingFiltered = useMemo(
    () => pending.filter((r) => !processedIds.has(r.id)),
    [pending, processedIds]
  );
  const pendingGroups = useMemo(() => groupByBrand(pendingFiltered), [pendingFiltered]);
  const completedGroups = useMemo(() => groupByBrand(completed), [completed]);

  async function handleRegenerate() {
    if (!regenModal.revision || !regenBrief.trim()) return;
    setRegenSubmitting(true);
    try {
      const res = await fetch(
        `/api/images/${regenModal.revision.imageId}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief: regenBrief.trim(),
            reviewId: regenModal.revision.id,
          }),
        }
      );
      if (res.ok) {
        setProcessedIds((prev) => new Set([...prev, regenModal.revision!.id]));
        setRegenModal({ open: false, revision: null });
        setRegenBrief("");
      }
    } catch {
      // handle error
    } finally {
      setRegenSubmitting(false);
    }
  }

  function openRegenModal(revision: RevisionRequest) {
    setRegenModal({ open: true, revision });
    setRegenBrief(revision.comment || "");
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);

    if (diffH < 1) return "Il y a moins d'1h";
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD === 1) return "Hier";
    if (diffD < 7) return `Il y a ${diffD} jours`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="space-y-6">
      {/* Pending section - grouped by brand */}
      {pendingGroups.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
              En attente ({pendingFiltered.length})
            </h2>
          </div>
          {pendingGroups.map((group) => (
            <div key={group.brandId} className="space-y-3">
              <BrandHeader group={group} />
              <div className="space-y-3 pl-2">
                {group.revisions.map((revision) => (
                  <Card
                    key={revision.id}
                    className="flex gap-4 p-4 border-l-4 border-l-amber-400"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <NextImage
                        src={`/api/images/${encodeURIComponent(revision.imagePath)}`}
                        alt="Visuel"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {revision.galleryName && (
                            <p className="text-xs text-muted-foreground">
                              Galerie: {revision.galleryName}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(revision.createdAt)}
                        </span>
                      </div>
                      {revision.comment && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-amber-800 mb-0.5">
                            Demande du client :
                          </p>
                          <p className="text-sm text-amber-900">
                            {revision.comment}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => openRegenModal(revision)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerer
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed section - grouped by brand */}
      {(completed.length > 0 || processedIds.size > 0) && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-semibold uppercase tracking-wide">
              Traitees ({completed.length + processedIds.size})
            </span>
            {showCompleted ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showCompleted && (
            <div className="space-y-6 opacity-60">
              {completedGroups.map((group) => (
                <div key={group.brandId} className="space-y-3">
                  <BrandHeader group={group} />
                  <div className="space-y-3 pl-2">
                    {group.revisions.map((revision) => (
                      <Card
                        key={revision.id}
                        className="flex gap-4 p-4 border-l-4 border-l-green-400"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <NextImage
                            src={`/api/images/${encodeURIComponent(revision.imagePath)}`}
                            alt="Visuel"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          {revision.comment && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {revision.comment}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Traitee
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regeneration Modal */}
      {regenModal.open && regenModal.revision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Regenerer le visuel</h3>
              <button
                onClick={() => setRegenModal({ open: false, revision: null })}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <NextImage
                    src={`/api/images/${encodeURIComponent(regenModal.revision.imagePath)}`}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {regenModal.revision.brandName}
                  </p>
                  {regenModal.revision.comment && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-amber-800 mb-0.5">
                        Demande du client :
                      </p>
                      <p className="text-xs text-amber-900">
                        {regenModal.revision.comment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Brief de regeneration
                </label>
                <textarea
                  value={regenBrief}
                  onChange={(e) => setRegenBrief(e.target.value)}
                  placeholder="Decrivez les modifications a apporter : changer le fond, enlever le texte, remplacer le produit..."
                  rows={4}
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L&apos;image originale sera utilisee comme reference pour Gemini.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRegenModal({ open: false, revision: null })}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={!regenBrief.trim() || regenSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regenSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
