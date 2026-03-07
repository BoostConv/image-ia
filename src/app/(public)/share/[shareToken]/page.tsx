"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, MessageSquare, Loader2, Eye } from "lucide-react";

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

export default function PublicGalleryPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewedImages, setReviewedImages] = useState<Set<string>>(new Set());

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

  const handleReview = useCallback(async (imageId: string, verdict: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${shareToken}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          verdict,
          comment: comment || undefined,
        }),
      });
      if (res.ok) {
        setReviewedImages((prev) => new Set([...prev, imageId]));
        setComment("");
        // Move to next unreviewed image
        if (gallery) {
          const currentIdx = gallery.images.findIndex((img) => img.id === imageId);
          const next = gallery.images.find(
            (img, i) => i > currentIdx && !reviewedImages.has(img.id)
          );
          setSelectedImage(next || null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }, [shareToken, comment, gallery, reviewedImages]);

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
            Ce lien a peut-etre expire ou n'existe plus.
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = gallery.brandingConfig?.primaryColor || "#6366f1";
  const reviewedCount = reviewedImages.size;
  const totalCount = gallery.images.length;

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: primaryColor }}>
              {reviewedCount}/{totalCount} valides
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

                {reviewedImages.has(selectedImage.id) ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Avis enregistre</span>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Commentaire optionnel..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{ ["--tw-ring-color" as string]: primaryColor } as React.CSSProperties}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleReview(selectedImage.id, "approved")}
                        disabled={submitting}
                        className="flex flex-col items-center gap-1 rounded-lg border-2 border-green-200 bg-green-50 p-3 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="text-xs font-medium">Valider</span>
                      </button>
                      <button
                        onClick={() => handleReview(selectedImage.id, "rejected")}
                        disabled={submitting}
                        className="flex flex-col items-center gap-1 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="h-6 w-6" />
                        <span className="text-xs font-medium">Refuser</span>
                      </button>
                      <button
                        onClick={() => handleReview(selectedImage.id, "revision")}
                        disabled={submitting}
                        className="flex flex-col items-center gap-1 rounded-lg border-2 border-amber-200 bg-amber-50 p-3 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span className="text-xs font-medium">Revision</span>
                      </button>
                    </div>
                  </>
                )}

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
              const isReviewed = reviewedImages.has(img.id);
              return (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`group relative aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-md transition-all ${
                    isReviewed ? "ring-2 ring-green-400" : ""
                  }`}
                >
                  <Image
                    src={`/api/images/${encodeURIComponent(img.filePath)}`}
                    alt="Visual"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isReviewed && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {img.status === "approved" && !isReviewed && (
                    <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {img.status === "rejected" && !isReviewed && (
                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                      <XCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 py-4">
          <p className="text-xs text-gray-400">
            Galerie partagee via Visual Intelligence Studio
          </p>
        </div>
      </div>
    </div>
  );
}
