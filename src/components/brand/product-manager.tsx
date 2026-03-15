"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  Upload,
  X,
  ImageIcon,
  ChevronDown,
  ChevronUp,

  Sparkles,
  Pencil,
  Check,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import { ProductAnalysisPanel } from "@/components/product/product-analysis-panel";
import { AnglesPanel } from "@/components/marketing/angles-panel";
import type { ProductAnalysis, AnglesPrioritization, ProductVariant } from "@/lib/db/schema";
import Image from "next/image";

function getImageUrl(relativePath: string): string {
  return `/api/images/${encodeURIComponent(relativePath)}`;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  usp: string | null;
  benefits: string[] | null;
  positioning: string | null;
  imagePaths: string[] | null;
  variants: ProductVariant[] | null;
  marketingArguments: {
    headlines: string[];
    hooks: string[];
    callToActions: string[];
    emotionalTriggers: string[];
    socialProof: string[];
    guarantees: string[];
  } | null;
  targetAudience: string | null;
  competitiveAdvantage: string | null;
  productAnalysis?: ProductAnalysis | null;
}

interface PersonaInfo {
  id: string;
  name: string;
}

export function ProductManager({
  brandId,
  initialProducts,
  personas = [],
}: {
  brandId: string;
  initialProducts: Product[];
  personas?: PersonaInfo[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [isCreatingFromUrl, setIsCreatingFromUrl] = useState(false);
  const [createUrl, setCreateUrl] = useState("");

  // AI Analysis state
  const [analyzingProductId, setAnalyzingProductId] = useState<string | null>(null);
  const [generatingAnglesFor, setGeneratingAnglesFor] = useState<string | null>(null);
  // Angles indexed by "productId:personaId"
  const [anglesByPersona, setAnglesByPersona] = useState<Record<string, AnglesPrioritization>>({});
  const [showAnalysisFor, setShowAnalysisFor] = useState<string | null>(null);
  const [showAnglesFor, setShowAnglesFor] = useState<string | null>(null);
  const [selectedPersonaFor, setSelectedPersonaFor] = useState<Record<string, string>>({});



  // Create product from URL: scrape + create + AI analysis in one shot
  async function handleCreateFromUrl() {
    if (!createUrl.trim()) return;
    setIsCreatingFromUrl(true);
    try {
      const res = await fetch("/api/products/create-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: createUrl, brandId }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => [...prev, data.product]);
        setCreateUrl("");
        setShowForm(false);
        if (data.product.productAnalysis) {
          setShowAnalysisFor(data.product.id);
          setExpandedId(data.product.id);
        }
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
      }
    } catch (err) {
      console.error("Create from URL error:", err);
    } finally {
      setIsCreatingFromUrl(false);
    }
  }

  // Re-run AI analysis on an existing product
  async function handleAnalyzeProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setAnalyzingProductId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: "" }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, productAnalysis: data.analysis } : p
          )
        );
        setShowAnalysisFor(productId);
      } else {
        const error = await res.json();
        alert(`Erreur d'analyse: ${error.error || "Erreur inconnue"}`);
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzingProductId(null);
    }
  }

  // Generate EPIC marketing angles for a specific persona
  async function handleGenerateAngles(productId: string, personaId: string) {
    const key = `${productId}:${personaId}`;
    setGeneratingAnglesFor(key);
    try {
      const res = await fetch(`/api/products/${productId}/angles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaIds: [personaId] }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnglesByPersona((prev) => ({ ...prev, [key]: data.angles }));
        setShowAnglesFor(key);
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
      }
    } catch (err) {
      console.error("Angles error:", err);
    } finally {
      setGeneratingAnglesFor(null);
    }
  }

  function handleDeleteAngle(key: string, angleId: string) {
    setAnglesByPersona((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const updatedAngles = current.angles.filter((a) => a.id !== angleId);
      const updatedPriority = current.priorityMatrix.filter((p) => p.angleId !== angleId);
      const updatedSynergies = current.synergies.filter(
        (s) => !s.angleIds.includes(angleId)
      );
      return {
        ...prev,
        [key]: {
          ...current,
          angles: updatedAngles,
          priorityMatrix: updatedPriority,
          synergies: updatedSynergies,
        },
      };
    });
  }

  async function handleDelete(id: string) {
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      category: product.category,
      usp: product.usp,
      benefits: product.benefits,
      positioning: product.positioning,
      targetAudience: product.targetAudience,
      competitiveAdvantage: product.competitiveAdvantage,
      marketingArguments: product.marketingArguments,
      imagePaths: product.imagePaths || [],
    });
  }

  async function handleSaveEdit(productId: string) {
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, ...editData }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, ...editData } as Product : p
          )
        );
        setEditingId(null);
        setEditData({});
      }
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleImageUpload(productId: string) {
    const file = imageFileRef.current?.files?.[0];
    if (!file) return;

    setUploadingImageFor(productId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      const res = await fetch("/api/products", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, imagePaths: data.imagePaths } : p
          )
        );
        // Also update editData if currently editing this product
        if (editingId === productId) {
          setEditData((d) => ({ ...d, imagePaths: data.imagePaths }));
        }
      }
    } finally {
      setUploadingImageFor(null);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }

  async function handleRemoveImage(productId: string, imageIndex: number) {
    const product = products.find((p) => p.id === productId);
    if (!product?.imagePaths) return;

    const updatedImages = product.imagePaths.filter((_, i) => i !== imageIndex);
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, imagePaths: updatedImages.length > 0 ? updatedImages : null }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, imagePaths: updatedImages.length > 0 ? updatedImages : null } : p
        )
      );
      if (editingId === productId) {
        setEditData((d) => ({ ...d, imagePaths: updatedImages }));
      }
    }
  }

  async function handleRemoveVariant(productId: string, variantId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product?.variants) return;

    const updatedVariants = product.variants.filter((v) => v.id !== variantId);
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, variants: updatedVariants.length > 0 ? updatedVariants : null }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, variants: updatedVariants.length > 0 ? updatedVariants : null } : p
        )
      );
    }
  }

  async function handleRemoveVariantImage(productId: string, variantId: string, imageIndex: number) {
    const product = products.find((p) => p.id === productId);
    if (!product?.variants) return;

    const updatedVariants = product.variants.map((v) => {
      if (v.id !== variantId) return v;
      return { ...v, imagePaths: v.imagePaths.filter((_, i) => i !== imageIndex) };
    });
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, variants: updatedVariants }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, variants: updatedVariants } : p
        )
      );
    }
  }


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Produits ({products.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ajoutez vos produits avec images de reference et arguments marketing pour des ads 100% alignees
      </p>

      {/* Add product form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Create from URL — single step */}
            <div className="space-y-1.5 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Creer depuis une URL produit
              </label>
              <div className="flex gap-2">
                <Input
                  value={createUrl}
                  onChange={(e) => setCreateUrl(e.target.value)}
                  placeholder="https://www.example.com/product/..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFromUrl()}
                />
                <Button
                  onClick={handleCreateFromUrl}
                  disabled={isCreatingFromUrl || !createUrl.trim()}
                  variant="default"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isCreatingFromUrl ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isCreatingFromUrl ? "Analyse en cours..." : "Creer + Analyser"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Collez l&apos;URL : le produit sera cree automatiquement avec scraping, images et analyse IA complete
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setCreateUrl(""); }}>
              Annuler
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer flex items-start gap-3"
                onClick={() =>
                  setExpandedId(expandedId === product.id ? null : product.id)
                }
              >
                {/* Product thumbnail in collapsed view */}
                {expandedId !== product.id && product.imagePaths?.[0] && (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border bg-white shrink-0">
                    <Image
                      src={getImageUrl(product.imagePaths[0])}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  {product.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {product.category}
                    </Badge>
                  )}
                  {expandedId === product.id ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                {product.usp && (
                  <p className="text-xs text-muted-foreground mt-0.5">{product.usp}</p>
                )}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {expandedId === product.id && editingId !== product.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEditing(product)}
                    title="Modifier"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-1">
              {product.benefits?.map((b, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {b}
                </Badge>
              ))}
              {(product.imagePaths?.length || 0) > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  <ImageIcon className="mr-0.5 h-2.5 w-2.5" />
                  {product.imagePaths!.length} photos
                </Badge>
              )}
              {(product.variants?.length || 0) > 0 && (
                <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700 dark:text-purple-400">
                  {product.variants!.length} variante{product.variants!.length > 1 ? "s" : ""}
                </Badge>
              )}
              {product.productAnalysis && (
                <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 dark:text-green-400">
                  <Brain className="mr-0.5 h-2.5 w-2.5" />
                  Analysé
                </Badge>
              )}
            </div>

            {/* Expanded view */}
            {expandedId === product.id && editingId !== product.id && (
              <div className="border-t pt-3 space-y-3">
                {/* Hero image + thumbnails */}
                {product.imagePaths && product.imagePaths.length > 0 && (
                  <div className="relative h-40 w-full rounded-lg overflow-hidden border bg-white">
                    <Image
                      src={getImageUrl(product.imagePaths[0])}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                )}

                {/* Reference images */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Images de reference</label>
                  <div className="flex gap-2 flex-wrap">
                    {product.imagePaths?.map((path, i) => (
                      <div key={i} className="group relative h-20 w-20 rounded-md overflow-hidden border">
                        <Image
                          src={getImageUrl(path)}
                          alt={`Ref ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(product.id, i)}
                          className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed hover:border-primary/50 transition-colors">
                      {uploadingImageFor === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                      <input
                        ref={imageFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={() => handleImageUpload(product.id)}
                      />
                    </label>
                  </div>
                </div>

                {/* Variant images */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Variantes ({product.variants.length})</label>
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="p-2 rounded-md bg-muted/30 border">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-[10px]">{variant.type}</Badge>
                          <span className="text-xs font-medium">{variant.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(product.id, variant.id)}
                            className="ml-auto h-5 w-5 rounded-full hover:bg-red-100 dark:hover:bg-red-950 text-red-500 flex items-center justify-center"
                            title="Supprimer cette variante"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {variant.imagePaths.length > 0 ? (
                          <div className="flex gap-1.5 flex-wrap">
                            {variant.imagePaths.map((path, imgIdx) => (
                              <div key={imgIdx} className="group relative h-16 w-16 rounded-md overflow-hidden border">
                                <Image
                                  src={getImageUrl(path)}
                                  alt={`${variant.name} ${imgIdx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantImage(product.id, variant.id, imgIdx)}
                                  className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">Aucune image pour cette variante</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Marketing arguments */}
                {product.marketingArguments && (
                  <div className="space-y-2">
                    {product.marketingArguments.headlines?.length > 0 && (
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Headlines</label>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.marketingArguments.headlines.map((h, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.marketingArguments.hooks?.length > 0 && (
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Hooks</label>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.marketingArguments.hooks.map((h, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.marketingArguments.emotionalTriggers?.length > 0 && (
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Triggers emotionnels</label>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.marketingArguments.emotionalTriggers.map((t, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {product.targetAudience && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Audience cible</label>
                    <p className="text-xs">{product.targetAudience}</p>
                  </div>
                )}

                {product.competitiveAdvantage && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Avantage concurrentiel</label>
                    <p className="text-xs">{product.competitiveAdvantage}</p>
                  </div>
                )}

                {/* AI Analysis Section */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Analyse IA
                  </h4>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {!product.productAnalysis ? (
                        <Button
                          onClick={() => handleAnalyzeProduct(product.id)}
                          disabled={analyzingProductId === product.id}
                          variant="default"
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {analyzingProductId === product.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Brain className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {analyzingProductId === product.id ? "Analyse en cours..." : "Lancer l'analyse IA"}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant={showAnalysisFor === product.id ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setShowAnalysisFor(showAnalysisFor === product.id ? null : product.id)
                            }
                          >
                            <Target className="mr-1.5 h-3.5 w-3.5" />
                            {showAnalysisFor === product.id ? "Masquer analyse" : "Voir analyse"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnalyzeProduct(product.id)}
                            disabled={analyzingProductId === product.id}
                            title="Re-lancer l'analyse"
                          >
                            {analyzingProductId === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Brain className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Analysis Panel */}
                    {showAnalysisFor === product.id && product.productAnalysis && (
                      <div className="mt-3">
                        <ProductAnalysisPanel
                          analysis={product.productAnalysis}
                          productName={product.name}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Angles EPIC par persona */}
                {product.productAnalysis && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      Angles EPIC par persona
                    </h4>

                    {personas.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Ajoutez des personas dans la section ci-dessous pour generer des angles marketing cibles.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {personas.map((persona) => {
                          const key = `${product.id}:${persona.id}`;
                          const hasAngles = !!anglesByPersona[key];
                          const isGenerating = generatingAnglesFor === key;
                          const isShown = showAnglesFor === key;

                          return (
                            <div key={persona.id} className="rounded-lg border">
                              <div className="flex items-center justify-between p-3 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                                    {persona.name}
                                  </span>
                                  {hasAngles && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {anglesByPersona[key].angles.length} angles
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  {hasAngles && (
                                    <Button
                                      variant={isShown ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => setShowAnglesFor(isShown ? null : key)}
                                    >
                                      {isShown ? "Masquer" : "Voir angles"}
                                    </Button>
                                  )}
                                  <Button
                                    variant={hasAngles ? "ghost" : "default"}
                                    size="sm"
                                    className={`h-7 text-xs ${!hasAngles ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                                    onClick={() => handleGenerateAngles(product.id, persona.id)}
                                    disabled={isGenerating}
                                  >
                                    {isGenerating ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Zap className="mr-1 h-3 w-3" />
                                    )}
                                    {isGenerating ? "Generation..." : hasAngles ? "Regenerer" : "Generer angles"}
                                  </Button>
                                </div>
                              </div>

                              {isShown && hasAngles && (
                                <div className="p-3 border-t">
                                  <AnglesPanel
                                    anglesData={anglesByPersona[key]}
                                    productName={product.name}
                                    personas={personas}
                                    onDeleteAngle={(angleId) => handleDeleteAngle(key, angleId)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inline edit mode */}
            {editingId === product.id && (
              <div className="border-t pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nom</label>
                    <Input
                      value={editData.name || ""}
                      onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Categorie</label>
                    <Input
                      value={editData.category || ""}
                      onChange={(e) => setEditData((d) => ({ ...d, category: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">USP</label>
                  <Textarea
                    value={editData.usp || ""}
                    onChange={(e) => setEditData((d) => ({ ...d, usp: e.target.value }))}
                    rows={2}
                    className="text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Positionnement</label>
                    <Input
                      value={editData.positioning || ""}
                      onChange={(e) => setEditData((d) => ({ ...d, positioning: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Audience cible</label>
                    <Input
                      value={editData.targetAudience || ""}
                      onChange={(e) => setEditData((d) => ({ ...d, targetAudience: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Avantage concurrentiel</label>
                  <Textarea
                    value={editData.competitiveAdvantage || ""}
                    onChange={(e) => setEditData((d) => ({ ...d, competitiveAdvantage: e.target.value }))}
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {/* Reference images */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Images de reference</label>
                  <div className="flex gap-2 flex-wrap">
                    {(editData.imagePaths || product.imagePaths)?.map((path, i) => (
                      <div key={i} className="group relative h-20 w-20 rounded-md overflow-hidden border">
                        <Image
                          src={getImageUrl(path)}
                          alt={`Ref ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(product.id, i)}
                          className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed hover:border-primary/50 transition-colors">
                      {uploadingImageFor === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                      <input
                        ref={imageFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={() => handleImageUpload(product.id)}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(product.id)}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-3 w-3" />
                    )}
                    Sauvegarder
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingId(null); setEditData({}); }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
