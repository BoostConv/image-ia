"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  RotateCcw,
  Star,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/images/url";

interface ReviewImage {
  id: string;
  filePath: string;
  format: string | null;
  status: string | null;
  preferenceScore: number | null;
  tags: string[] | null;
  createdAt: string;
}

export function ReviewClient({
  brandId,
  brandName,
  initialImages,
}: {
  brandId: string;
  brandName: string;
  initialImages: ReviewImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<ReviewImage | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredImages =
    filter === "all" ? images : images.filter((i) => i.status === filter);

  const counts = {
    all: images.length,
    pending: images.filter((i) => i.status === "pending").length,
    approved: images.filter((i) => i.status === "approved").length,
    rejected: images.filter((i) => i.status === "rejected").length,
  };

  async function handleReview(verdict: "approved" | "rejected" | "revision") {
    if (!selectedImage) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          verdict,
          comment: comment || undefined,
          rating: rating || undefined,
        }),
      });

      if (res.ok) {
        const statusMap: Record<string, string> = {
          approved: "approved",
          rejected: "rejected",
          revision: "pending",
        };

        setImages((prev) =>
          prev.map((img) =>
            img.id === selectedImage.id
              ? {
                  ...img,
                  status: statusMap[verdict],
                  preferenceScore: rating || img.preferenceScore,
                }
              : img
          )
        );

        // Move to next pending image
        const pendingImages = images.filter(
          (i) => i.status === "pending" && i.id !== selectedImage.id
        );
        setSelectedImage(pendingImages[0] || null);
        setRating(0);
        setComment("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: "all", label: "Tous" },
            { key: "pending", label: "En attente" },
            { key: "approved", label: "Valides" },
            { key: "rejected", label: "Refuses" },
          ] as const
        ).map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Image grid */}
        <div className="lg:col-span-2">
          {filteredImages.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun visuel dans cette categorie
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredImages.map((img) => (
                <Card
                  key={img.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    selectedImage?.id === img.id
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 hover:ring-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedImage(img);
                    setRating(img.preferenceScore || 0);
                    setComment("");
                  }}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={getPublicImageUrl(img.filePath)}
                      alt="Visuel"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {/* Status overlay */}
                    <div className="absolute top-1.5 right-1.5">
                      <Badge
                        variant={
                          img.status === "approved"
                            ? "default"
                            : img.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[9px]"
                      >
                        {img.status === "approved"
                          ? "Valide"
                          : img.status === "rejected"
                            ? "Refuse"
                            : "En attente"}
                      </Badge>
                    </div>
                    {/* Rating overlay */}
                    {img.preferenceScore && img.preferenceScore > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 rounded px-1.5 py-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < img.preferenceScore!
                                ? "text-amber-400 fill-amber-400"
                                : "text-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Review panel */}
        <div className="lg:col-span-1">
          {selectedImage ? (
            <Card className="sticky top-4">
              <CardContent className="pt-4 space-y-4">
                {/* Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={getPublicImageUrl(selectedImage.filePath)}
                    alt="Visuel selectionne"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>

                {/* Rating */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Note</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-0.5 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (hoverRating || rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Commentaire</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Notes sur ce visuel..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleReview("approved")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Valider
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReview("rejected")}
                    disabled={isSubmitting}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Refuser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview("revision")}
                    disabled={isSubmitting}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Revision
                  </Button>
                </div>

                {/* Info */}
                <div className="flex flex-wrap gap-1">
                  {selectedImage.format && (
                    <Badge variant="outline" className="text-[10px]">
                      {selectedImage.format}
                    </Badge>
                  )}
                  {selectedImage.tags?.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Cliquez sur un visuel pour le noter et le valider
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
