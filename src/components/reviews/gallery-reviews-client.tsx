"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";

interface GalleryImage {
  id: string;
  filePath: string;
  status: string | null;
  format: string | null;
}

interface GalleryReview {
  id: string;
  imageId: string;
  verdict: string;
  comment: string | null;
  createdAt: string;
}

interface GalleryWithDetails {
  id: string;
  name: string;
  description: string | null;
  shareToken: string;
  viewCount: number | null;
  createdAt: string;
  images: GalleryImage[];
  reviews: GalleryReview[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);

  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return formatDate(dateStr);
}

export function GalleryReviewsClient({
  galleries,
}: {
  galleries: GalleryWithDetails[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    galleries[0]?.id || null
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  function copyShareLink(shareToken: string) {
    const link = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function getReviewForImage(gallery: GalleryWithDetails, imageId: string) {
    // Get the most recent review for this image in this gallery
    return gallery.reviews.find((r) => r.imageId === imageId);
  }

  function getGalleryStats(gallery: GalleryWithDetails) {
    const total = gallery.images.length;
    const reviewed = new Set(gallery.reviews.map((r) => r.imageId)).size;
    const approved = gallery.reviews.filter((r) => r.verdict === "approved").length;
    const rejected = gallery.reviews.filter((r) => r.verdict === "rejected").length;
    const revisions = gallery.reviews.filter((r) => r.verdict === "revision").length;
    return { total, reviewed, approved, rejected, revisions };
  }

  return (
    <div className="space-y-4">
      {galleries.map((gallery) => {
        const isExpanded = expandedId === gallery.id;
        const stats = getGalleryStats(gallery);
        const hasReviews = gallery.reviews.length > 0;

        return (
          <Card key={gallery.id} className="overflow-hidden">
            {/* Gallery header */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : gallery.id)}
            >
              {/* Thumbnails stack */}
              <div className="flex -space-x-3 shrink-0">
                {gallery.images.slice(0, 3).map((img, i) => (
                  <div
                    key={img.id}
                    className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-background bg-muted"
                    style={{ zIndex: 3 - i }}
                  >
                    <Image
                      src={`/api/images/${encodeURIComponent(img.filePath)}`}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ))}
                {gallery.images.length > 3 && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                    +{gallery.images.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{gallery.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {gallery.images.length} visuels
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatDate(gallery.createdAt)}</span>
                  {(gallery.viewCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {gallery.viewCount} vue{(gallery.viewCount ?? 0) > 1 ? "s" : ""}
                    </span>
                  )}
                  {hasReviews && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {stats.reviewed}/{stats.total} revus
                    </span>
                  )}
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {stats.approved > 0 && (
                  <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                    {stats.approved}
                  </Badge>
                )}
                {stats.rejected > 0 && (
                  <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100">
                    <XCircle className="h-3 w-3 mr-0.5" />
                    {stats.rejected}
                  </Badge>
                )}
                {stats.revisions > 0 && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <MessageSquare className="h-3 w-3 mr-0.5" />
                    {stats.revisions}
                  </Badge>
                )}
                {!hasReviews && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-0.5" />
                    En attente
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t">
                {/* Share link bar */}
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <code className="text-[11px] font-mono text-muted-foreground truncate flex-1">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/share/${gallery.shareToken}`
                      : `/share/${gallery.shareToken}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyShareLink(gallery.shareToken);
                    }}
                  >
                    {copiedToken === gallery.shareToken ? (
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedToken === gallery.shareToken ? "Copie !" : "Copier"}
                  </Button>
                  <a
                    href={`/share/${gallery.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ouvrir
                    </Button>
                  </a>
                </div>

                {/* Images grid with reviews */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {gallery.images.map((img) => {
                      const review = getReviewForImage(gallery, img.id);
                      return (
                        <div key={img.id} className="space-y-1.5">
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                            <Image
                              src={`/api/images/${encodeURIComponent(img.filePath)}`}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            {/* Verdict overlay */}
                            {review && (
                              <div className="absolute top-1.5 right-1.5">
                                {review.verdict === "approved" && (
                                  <div className="rounded-full bg-green-500 p-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                                {review.verdict === "rejected" && (
                                  <div className="rounded-full bg-red-500 p-1">
                                    <XCircle className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                                {review.verdict === "revision" && (
                                  <div className="rounded-full bg-amber-500 p-1">
                                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                            )}
                            {!review && (
                              <div className="absolute top-1.5 right-1.5">
                                <div className="rounded-full bg-gray-400/80 p-1">
                                  <Clock className="h-3.5 w-3.5 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Review comment */}
                          {review?.comment && (
                            <div className={`rounded-md px-2 py-1.5 text-[11px] leading-snug ${
                              review.verdict === "approved"
                                ? "bg-green-50 text-green-800 border border-green-100"
                                : review.verdict === "rejected"
                                  ? "bg-red-50 text-red-800 border border-red-100"
                                  : "bg-amber-50 text-amber-800 border border-amber-100"
                            }`}>
                              {review.comment}
                            </div>
                          )}
                          {review && !review.comment && (
                            <p className={`text-[10px] font-medium ${
                              review.verdict === "approved"
                                ? "text-green-600"
                                : review.verdict === "rejected"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}>
                              {review.verdict === "approved"
                                ? "Valide"
                                : review.verdict === "rejected"
                                  ? "Refuse"
                                  : "Revision demandee"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
