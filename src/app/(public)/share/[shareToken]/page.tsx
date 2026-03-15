"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, CheckCircle2, XCircle, Pencil, Copy } from "lucide-react";
import { ReviewButtons, type ReviewVerdict } from "@/components/reviews/review-buttons";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ReviewerIdentityModal, type ReviewerIdentity } from "@/components/reviews/reviewer-identity-modal";

interface GalleryImage {
  id: string;
  filePath: string;
  format: string | null;
  status: string | null;
  tags: string[] | null;
}

interface Gallery {
  id: string;
  name: string;
  description: string | null;
  brandingConfig: {
    logoPath?: string;
    primaryColor?: string;
    headerText?: string;
  } | null;
  viewCount: number;
  images: GalleryImage[];
}

interface ReviewRecord {
  id: string;
  imageId: string;
  verdict: string;
  comment: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  createdAt: string;
}

const verdictIcons: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  approved: { icon: CheckCircle2, color: "text-green-600", label: "Valide" },
  rejected: { icon: XCircle, color: "text-red-600", label: "Refuse" },
  revision: { icon: Pencil, color: "text-amber-600", label: "Corriger" },
  variant: { icon: Copy, color: "text-blue-600", label: "Variant" },
};

const verdictBadgeColors: Record<string, string> = {
  approved: "bg-green-500",
  rejected: "bg-red-500",
  revision: "bg-amber-500",
  variant: "bg-blue-500",
};

export default function PublicGalleryPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedVerdicts, setReviewedVerdicts] = useState<Map<string, string>>(new Map());
  // Reviewer identity
  const [reviewer, setReviewer] = useState<ReviewerIdentity | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  // Review modal
  const [reviewModal, setReviewModal] = useState<{ open: boolean; verdict: ReviewVerdict | null }>({
    open: false,
    verdict: null,
  });
  // Colleague reviews
  const [allReviews, setAllReviews] = useState<ReviewRecord[]>([]);

  // Load reviewer identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`reviewer_${shareToken}`);
    if (stored) {
      try {
        setReviewer(JSON.parse(stored));
      } catch {
        setShowIdentityModal(true);
      }
    } else {
      setShowIdentityModal(true);
    }
  }, [shareToken]);

  // Fetch gallery
  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch(`/api/galleries/${shareToken}`);
        if (!res.ok) {
          setError("Galerie introuvable ou expiree");
          return;
        }
        const data = await res.json();
        setGallery(data);
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [shareToken]);

  // Fetch reviews for this gallery
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/galleries/${shareToken}/reviews`);
        if (res.ok) {
          const reviews: ReviewRecord[] = await res.json();
          setAllReviews(reviews);

          // Pre-fill own verdicts
          if (reviewer) {
            const own = new Map<string, string>();
            for (const r of reviews) {
              if (isOwnReview(r) && !own.has(r.imageId)) {
                own.set(r.imageId, r.verdict);
              }
            }
            setReviewedVerdicts(own);
          }
        }
      } catch {
        // silently fail
      }
    }
    if (gallery && reviewer) {
      fetchReviews();
    }
  }, [gallery, reviewer, shareToken]);

  const isOwnReview = useCallback((r: ReviewRecord) => {
    if (!reviewer) return false;
    if (reviewer.email && r.reviewerEmail) {
      return r.reviewerEmail.toLowerCase() === reviewer.email.toLowerCase();
    }
    return r.reviewerName?.toLowerCase() === reviewer.name.toLowerCase();
  }, [reviewer]);

  const getColleagueReviews = useCallback((imageId: string): ReviewRecord[] => {
    return allReviews.filter((r) => r.imageId === imageId && !isOwnReview(r));
  }, [allReviews, isOwnReview]);

  const handleIdentityConfirm = (identity: ReviewerIdentity) => {
    setReviewer(identity);
    localStorage.setItem(`reviewer_${shareToken}`, JSON.stringify(identity));
    setShowIdentityModal(false);
  };

  const handleReviewClick = (verdict: ReviewVerdict) => {
    setReviewModal({ open: true, verdict });
  };

  const handleReviewSubmit = useCallback(async (comment: string) => {
    if (!selectedImage || !reviewModal.verdict || !reviewer) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${shareToken}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          verdict: reviewModal.verdict,
          comment: comment || undefined,
          reviewerName: reviewer.name,
          reviewerEmail: reviewer.email || undefined,
        }),
      });
      if (res.ok) {
        setReviewedVerdicts((prev) => new Map(prev).set(selectedImage.id, reviewModal.verdict!));
        // Add to local reviews for colleague display
        const { id } = await res.json();
        setAllReviews((prev) => [
          {
            id,
            imageId: selectedImage.id,
            verdict: reviewModal.verdict!,
            comment: comment || null,
            reviewerName: reviewer.name,
            reviewerEmail: reviewer.email || null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setReviewModal({ open: false, verdict: null });

        // Move to next unreviewed image
        if (gallery) {
          const currentIdx = gallery.images.findIndex((img) => img.id === selectedImage.id);
          const next = gallery.images.find(
            (img, i) => i > currentIdx && !reviewedVerdicts.has(img.id) && img.id !== selectedImage.id
          );
          setSelectedImage(next || null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }, [selectedImage, reviewModal.verdict, reviewer, shareToken, gallery, reviewedVerdicts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700">
            {error || "Galerie introuvable"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Ce lien a peut-etre expire ou n&apos;existe plus.
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = gallery.brandingConfig?.primaryColor || "#6366f1";
  const reviewedCount = reviewedVerdicts.size;
  const totalCount = gallery.images.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Identity modal */}
      {showIdentityModal && !reviewer && (
        <ReviewerIdentityModal
          onConfirm={handleIdentityConfirm}
          primaryColor={primaryColor}
        />
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {gallery.brandingConfig?.headerText || gallery.name}
            </h1>
            {gallery.description && (
              <p className="text-sm text-gray-500">{gallery.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {reviewer && (
              <p className="text-xs text-gray-500">
                Connecte: <span className="font-medium text-gray-700">{reviewer.name}</span>
              </p>
            )}
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: primaryColor }}>
                {reviewedCount}/{totalCount} revus
              </p>
              <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0}%`,
                    backgroundColor: primaryColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Selected image detail */}
        {selectedImage && (
          <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-2/3 bg-gray-100 flex items-center justify-center p-4">
                <Image
                  src={`/api/images/${encodeURIComponent(selectedImage.filePath)}`}
                  alt="Visual"
                  width={800}
                  height={800}
                  className="max-h-[500px] w-auto object-contain rounded"
                />
              </div>
              <div className="md:w-1/3 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Votre avis
                </h3>

                <ReviewButtons
                  existingVerdict={reviewedVerdicts.get(selectedImage.id)}
                  onReview={handleReviewClick}
                  disabled={submitting}
                />

                {/* Colleague reviews */}
                {(() => {
                  const colleagues = getColleagueReviews(selectedImage.id);
                  if (colleagues.length === 0) return null;
                  return (
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Avis des collegues
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {colleagues.map((r) => {
                          const vInfo = verdictIcons[r.verdict];
                          if (!vInfo) return null;
                          const Icon = vInfo.icon;
                          return (
                            <div key={r.id} className="flex items-start gap-2 text-xs">
                              <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${vInfo.color}`} />
                              <div>
                                <span className="font-medium text-gray-700">
                                  {r.reviewerName || "Anonyme"}
                                </span>
                                <span className="text-gray-400 mx-1">—</span>
                                <span className={vInfo.color}>{vInfo.label}</span>
                                {r.comment && (
                                  <p className="text-gray-500 mt-0.5">&quot;{r.comment}&quot;</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Retour a la grille
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image grid */}
        {!selectedImage && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.images.map((img) => {
              const verdict = reviewedVerdicts.get(img.id);
              const badgeColor = verdict ? verdictBadgeColors[verdict] : null;
              const vInfo = verdict ? verdictIcons[verdict] : null;
              return (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`group relative aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-md transition-all ${
                    verdict ? "ring-2" : ""
                  }`}
                  style={verdict ? { "--tw-ring-color": badgeColor?.replace("bg-", "") } as React.CSSProperties : undefined}
                >
                  <Image
                    src={`/api/images/${encodeURIComponent(img.filePath)}`}
                    alt="Visual"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {vInfo && (
                    <div className={`absolute top-2 right-2 ${badgeColor} rounded-full p-1`}>
                      <vInfo.icon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {/* Colleague count */}
                  {(() => {
                    const colleagues = getColleagueReviews(img.id);
                    if (colleagues.length === 0) return null;
                    return (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] rounded-full px-1.5 py-0.5 font-medium">
                        {colleagues.length} avis
                      </div>
                    );
                  })()}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 py-4">
          <p className="text-xs text-gray-400">
            Galerie partagee via Boost IA Static
          </p>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.open && reviewModal.verdict && (
        <ReviewModal
          verdict={reviewModal.verdict}
          onConfirm={handleReviewSubmit}
          onCancel={() => setReviewModal({ open: false, verdict: null })}
          submitting={submitting}
        />
      )}
    </div>
  );
}
