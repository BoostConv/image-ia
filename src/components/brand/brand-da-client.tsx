"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Trash2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Eye,
  Palette,
  X,
  Camera,
  Sparkles,
} from "lucide-react";

import { getPublicImageUrl } from "@/lib/images/url";

interface BrandDAFingerprint {
  dominant_colors: string[];
  color_temperature: string;
  color_saturation: string;
  uses_gradients: boolean;
  gradient_style?: string;
  photo_style: string;
  lighting_style: string;
  camera_angles: string[];
  depth_of_field: string;
  mood: string;
  layout_patterns: string[];
  negative_space_usage: string;
  product_to_lifestyle_ratio: number;
  text_placement_patterns: string[];
  font_weight_dominant: string;
  text_case_dominant: string;
  text_color_strategy: string;
  recurring_textures: string[];
  background_treatments: string[];
  visual_personality: string;
  closest_visual_styles: string[];
  image_count_analyzed: number;
  confidence: number;
}

export function BrandDAClient({
  brandId,
  initialImages,
  initialFingerprint,
}: {
  brandId: string;
  initialImages: string[];
  initialFingerprint: BrandDAFingerprint | null;
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [fingerprint, setFingerprint] = useState<BrandDAFingerprint | null>(initialFingerprint);
  const [editedFingerprint, setEditedFingerprint] = useState<BrandDAFingerprint | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setMessage(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/brands/${brandId}/style-images`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
          setFingerprint(null); // Invalidate fingerprint when images change
        }
      }
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setMessage(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(path: string) {
    try {
      const res = await fetch(`/api/brands/${brandId}/style-images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
        setFingerprint(null);
      }
    } catch (err) {
      setMessage(`Erreur: ${(err as Error).message}`);
    }
  }

  async function handleAnalyze() {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/da-fingerprint`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setFingerprint(data.fingerprint);
      setEditedFingerprint(null);
      setShowEditor(true);
      setMessage("Analyse DA terminee");
    } catch (err) {
      setMessage(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!editedFingerprint) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/da-fingerprint`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: editedFingerprint }),
      });
      if (res.ok) {
        setFingerprint({ ...editedFingerprint });
        setMessage("Sauvegarde");
      }
    } catch (err) {
      setMessage(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function openEditor() {
    setEditedFingerprint(fingerprint ? { ...fingerprint } : null);
    setShowEditor(true);
  }

  const updateField = (field: keyof BrandDAFingerprint, value: unknown) => {
    if (!editedFingerprint) return;
    setEditedFingerprint({ ...editedFingerprint, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Direction Artistique
        </h2>
        <div className="flex items-center gap-2">
          {fingerprint && (
            <Button variant="outline" size="sm" onClick={openEditor}>
              <Eye className="mr-1 h-3 w-3" />
              Voir l{"'"}analyse
            </Button>
          )}
          <Button
            variant={fingerprint ? "outline" : "default"}
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || images.length === 0}
          >
            {isAnalyzing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            {isAnalyzing ? "Analyse..." : fingerprint ? "Re-analyser" : "Analyser la DA"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Uploadez des visuels de la marque (ads, posts Instagram, photos produit, visuels de campagne).
        L{"'"}IA analyse la direction artistique reelle pour la reproduire.
      </p>

      {message && (
        <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
          message.startsWith("Erreur") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
        }`}>
          {message}
        </div>
      )}

      {/* Upload zone */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex-1 border-dashed h-20"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Ajouter des visuels (ads, posts, campagnes...)
              </span>
            </div>
          )}
        </Button>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <div
              key={img}
              className="group relative rounded-lg overflow-hidden ring-1 ring-foreground/5 bg-muted aspect-square"
            >
              <img
                src={getPublicImageUrl(img)}
                alt={`Style ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={() => handleDelete(img)}
                className="absolute top-1 right-1 p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fingerprint status */}
      {fingerprint && !showEditor && (
        <Card className="cursor-pointer hover:ring-primary/30 transition-all" onClick={openEditor}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {fingerprint.dominant_colors.slice(0, 5).map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full ring-1 ring-foreground/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium">{fingerprint.visual_personality}</p>
                  <p className="text-xs text-muted-foreground">
                    {fingerprint.mood} — {fingerprint.photo_style}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {fingerprint.image_count_analyzed} images
                </Badge>
                <Badge
                  variant={fingerprint.confidence >= 0.7 ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {Math.round(fingerprint.confidence * 100)}% confiance
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fingerprint editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowEditor(false)} />
          <div className="relative bg-card rounded-2xl ring-1 ring-foreground/10 shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5 shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Direction Artistique — Analyse IA</h2>
                <p className="text-xs text-muted-foreground">
                  {fingerprint?.image_count_analyzed || 0} visuels analyses — confiance {Math.round((fingerprint?.confidence || 0) * 100)}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || images.length === 0}
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                  {isAnalyzing ? "..." : "Re-analyser"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !editedFingerprint}
                  className="text-green-600"
                >
                  <Save className="mr-1 h-3 w-3" />
                  {isSaving ? "..." : "Sauvegarder"}
                </Button>
                <button onClick={() => setShowEditor(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!editedFingerprint && !fingerprint ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Eye className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Pas encore d{"'"}analyse DA</p>
                  <p className="text-xs mt-1">Uploadez des visuels et cliquez &quot;Analyser la DA&quot;</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-4">
                    <SectionLabel label="Personnalite visuelle" />
                    <DAField
                      label="Personnalite"
                      value={(editedFingerprint || fingerprint)!.visual_personality}
                      onChange={(v) => updateField("visual_personality", v)}
                    />
                    <DAField
                      label="Mood / Atmosphere"
                      value={(editedFingerprint || fingerprint)!.mood}
                      onChange={(v) => updateField("mood", v)}
                    />
                    <DAArrayField
                      label="Styles visuels proches"
                      value={(editedFingerprint || fingerprint)!.closest_visual_styles}
                      onChange={(v) => updateField("closest_visual_styles", v)}
                    />

                    <SectionLabel label="Couleurs" />
                    <DAArrayField
                      label="Couleurs dominantes"
                      value={(editedFingerprint || fingerprint)!.dominant_colors}
                      onChange={(v) => updateField("dominant_colors", v)}
                      colors
                    />
                    <DAField
                      label="Temperature"
                      value={(editedFingerprint || fingerprint)!.color_temperature}
                      onChange={(v) => updateField("color_temperature", v)}
                    />
                    <DAField
                      label="Saturation"
                      value={(editedFingerprint || fingerprint)!.color_saturation}
                      onChange={(v) => updateField("color_saturation", v)}
                    />
                    {(editedFingerprint || fingerprint)!.gradient_style && (
                      <DAField
                        label="Style de degrade"
                        value={(editedFingerprint || fingerprint)!.gradient_style || ""}
                        onChange={(v) => updateField("gradient_style", v)}
                      />
                    )}

                    <SectionLabel label="Typographie" />
                    <DAField
                      label="Poids dominant"
                      value={(editedFingerprint || fingerprint)!.font_weight_dominant}
                      onChange={(v) => updateField("font_weight_dominant", v)}
                    />
                    <DAField
                      label="Casse dominante"
                      value={(editedFingerprint || fingerprint)!.text_case_dominant}
                      onChange={(v) => updateField("text_case_dominant", v)}
                    />
                    <DAField
                      label="Strategie couleur texte"
                      value={(editedFingerprint || fingerprint)!.text_color_strategy}
                      onChange={(v) => updateField("text_color_strategy", v)}
                    />
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    <SectionLabel label="Photographie" />
                    <DAField
                      label="Style photo"
                      value={(editedFingerprint || fingerprint)!.photo_style}
                      onChange={(v) => updateField("photo_style", v)}
                    />
                    <DAField
                      label="Eclairage"
                      value={(editedFingerprint || fingerprint)!.lighting_style}
                      onChange={(v) => updateField("lighting_style", v)}
                    />
                    <DAArrayField
                      label="Angles camera"
                      value={(editedFingerprint || fingerprint)!.camera_angles}
                      onChange={(v) => updateField("camera_angles", v)}
                    />
                    <DAField
                      label="Profondeur de champ"
                      value={(editedFingerprint || fingerprint)!.depth_of_field}
                      onChange={(v) => updateField("depth_of_field", v)}
                    />

                    <SectionLabel label="Composition" />
                    <DAArrayField
                      label="Patterns de layout"
                      value={(editedFingerprint || fingerprint)!.layout_patterns}
                      onChange={(v) => updateField("layout_patterns", v)}
                    />
                    <DAField
                      label="Espace negatif"
                      value={(editedFingerprint || fingerprint)!.negative_space_usage}
                      onChange={(v) => updateField("negative_space_usage", v)}
                    />
                    <DAArrayField
                      label="Placement texte"
                      value={(editedFingerprint || fingerprint)!.text_placement_patterns}
                      onChange={(v) => updateField("text_placement_patterns", v)}
                    />

                    <SectionLabel label="Textures & Fonds" />
                    <DAArrayField
                      label="Textures recurrentes"
                      value={(editedFingerprint || fingerprint)!.recurring_textures}
                      onChange={(v) => updateField("recurring_textures", v)}
                    />
                    <DAArrayField
                      label="Traitements de fond"
                      value={(editedFingerprint || fingerprint)!.background_treatments}
                      onChange={(v) => updateField("background_treatments", v)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-foreground/5">
      {label}
    </p>
  );
}

function DAField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 ring-1 ring-foreground/5 focus:ring-primary/30 focus:outline-none"
      />
    </div>
  );
}

function DAArrayField({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  colors?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="space-y-1.5">
        {(value || []).map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {colors && (
              <div
                className="w-4 h-4 rounded-full ring-1 ring-foreground/10 shrink-0"
                style={{ backgroundColor: item }}
              />
            )}
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 text-sm bg-muted/50 rounded-lg px-3 py-1.5 ring-1 ring-foreground/5 focus:ring-primary/30 focus:outline-none"
            />
            <button
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...(value || []), ""])}
          className="text-xs text-primary hover:underline"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}
