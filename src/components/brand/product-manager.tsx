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
  Globe,
  Sparkles,
  Pencil,
  Check,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import { ProductAnalysisPanel } from "@/components/product/product-analysis-panel";
import { AnglesPanel } from "@/components/marketing/angles-panel";
import type { ProductAnalysis, MarketingAngleSpec, AnglesPrioritization } from "@/lib/db/schema";
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

export function ProductManager({
  brandId,
  initialProducts,
}: {
  brandId: string;
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");

  // AI Analysis state
  const [analyzingProductId, setAnalyzingProductId] = useState<string | null>(null);
  const [generatingAnglesFor, setGeneratingAnglesFor] = useState<string | null>(null);
  const [productAngles, setProductAngles] = useState<Record<string, AnglesPrioritization>>({});
  const [showAnalysisFor, setShowAnalysisFor] = useState<string | null>(null);
  const [showAnglesFor, setShowAnglesFor] = useState<string | null>(null);
  const [analyzeUrl, setAnalyzeUrl] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [usp, setUsp] = useState("");
  const [positioning, setPositioning] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState("");
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [headlines, setHeadlines] = useState<string[]>([""]);
  const [hooks, setHooks] = useState<string[]>([""]);
  const [callToActions, setCallToActions] = useState<string[]>([""]);
  const [emotionalTriggers, setEmotionalTriggers] = useState<string[]>([""]);
  const [socialProof, setSocialProof] = useState<string[]>([""]);
  const [scrapedImagePaths, setScrapedImagePaths] = useState<string[]>([]);

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const res = await fetch("/api/products/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, brandId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Pre-fill form with scraped data
        if (data.name) setName(data.name);
        if (data.usp) setUsp(data.usp);
        if (data.positioning) setPositioning(data.positioning);
        if (data.targetAudience) setTargetAudience(data.targetAudience);
        if (data.benefits?.length) setBenefits(data.benefits);
        if (data.marketingArguments) {
          if (data.marketingArguments.headlines?.length)
            setHeadlines(data.marketingArguments.headlines);
          if (data.marketingArguments.hooks?.length)
            setHooks(data.marketingArguments.hooks);
          if (data.marketingArguments.callToActions?.length)
            setCallToActions(data.marketingArguments.callToActions);
          if (data.marketingArguments.emotionalTriggers?.length)
            setEmotionalTriggers(data.marketingArguments.emotionalTriggers);
          if (data.marketingArguments.socialProof?.length)
            setSocialProof(data.marketingArguments.socialProof);
        }
        if (data.imagePaths?.length) setScrapedImagePaths(data.imagePaths);
        setScrapeUrl("");
      }
    } catch (err) {
      console.error("Scrape error:", err);
    } finally {
      setIsScraping(false);
    }
  }

  // AI Analysis: Analyze product with Claude
  async function handleAnalyzeProduct(productId: string) {
    const url = analyzeUrl[productId];
    if (!url?.trim()) return;

    setAnalyzingProductId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: url }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, productAnalysis: data.analysis } : p
          )
        );
        setShowAnalysisFor(productId);
        setAnalyzeUrl((prev) => ({ ...prev, [productId]: "" }));
      } else {
        const error = await res.json();
        console.error("Analysis error:", error);
        alert(`Erreur d'analyse: ${error.error || "Erreur inconnue"}`);
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzingProductId(null);
    }
  }

  // Generate EPIC marketing angles
  async function handleGenerateAngles(productId: string) {
    setGeneratingAnglesFor(productId);
    try {
      const res = await fetch(`/api/products/${productId}/angles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setProductAngles((prev) => ({ ...prev, [productId]: data.angles }));
        setShowAnglesFor(productId);
      } else {
        const error = await res.json();
        console.error("Angles error:", error);
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
      }
    } catch (err) {
      console.error("Angles error:", err);
    } finally {
      setGeneratingAnglesFor(null);
    }
  }

  function resetForm() {
    setName("");
    setCategory("");
    setUsp("");
    setPositioning("");
    setTargetAudience("");
    setCompetitiveAdvantage("");
    setBenefits([""]);
    setHeadlines([""]);
    setHooks([""]);
    setCallToActions([""]);
    setEmotionalTriggers([""]);
    setSocialProof([""]);
    setScrapedImagePaths([]);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          name,
          category: category || undefined,
          usp: usp || undefined,
          benefits: benefits.filter(Boolean),
          positioning: positioning || undefined,
          targetAudience: targetAudience || undefined,
          competitiveAdvantage: competitiveAdvantage || undefined,
          marketingArguments: {
            headlines: headlines.filter(Boolean),
            hooks: hooks.filter(Boolean),
            callToActions: callToActions.filter(Boolean),
            emotionalTriggers: emotionalTriggers.filter(Boolean),
            socialProof: socialProof.filter(Boolean),
            guarantees: [],
          },
          imagePaths: scrapedImagePaths.length > 0 ? scrapedImagePaths : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => [
          ...prev,
          {
            id: data.id,
            name,
            category: category || null,
            usp: usp || null,
            benefits: benefits.filter(Boolean),
            positioning: positioning || null,
            imagePaths: scrapedImagePaths.length > 0 ? scrapedImagePaths : null,
            marketingArguments: {
              headlines: headlines.filter(Boolean),
              hooks: hooks.filter(Boolean),
              callToActions: callToActions.filter(Boolean),
              emotionalTriggers: emotionalTriggers.filter(Boolean),
              socialProof: socialProof.filter(Boolean),
              guarantees: [],
            },
            targetAudience: targetAudience || null,
            competitiveAdvantage: competitiveAdvantage || null,
          },
        ]);
        resetForm();
        setShowForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
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

  function updateArrayField(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addArrayField(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function removeArrayField(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  function ArrayFieldEditor({
    label,
    placeholder,
    values,
    setter,
  }: {
    label: string;
    placeholder: string;
    values: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {values.map((val, i) => (
          <div key={i} className="flex gap-1.5">
            <Input
              value={val}
              onChange={(e) => updateArrayField(setter, i, e.target.value)}
              placeholder={`${placeholder} ${i + 1}`}
              className="text-xs h-8"
            />
            {values.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeArrayField(setter, i)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => addArrayField(setter)}
        >
          <Plus className="mr-1 h-2.5 w-2.5" />
          Ajouter
        </Button>
      </div>
    );
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
            {/* Scrape URL */}
            <div className="space-y-1.5 p-3 bg-muted/50 rounded-lg border border-dashed">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Scrapper une page produit
              </label>
              <div className="flex gap-2">
                <Input
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://www.example.com/product/..."
                  className="text-sm"
                />
                <Button
                  onClick={handleScrape}
                  disabled={isScraping || !scrapeUrl.trim()}
                  variant="secondary"
                  size="sm"
                >
                  {isScraping ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Scrapper
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Collez l&apos;URL de la page produit pour pre-remplir automatiquement les champs
              </p>
              {scrapedImagePaths.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1.5">
                    {scrapedImagePaths.length} photo(s) produit recuperee(s)
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {scrapedImagePaths.map((path, i) => (
                      <div key={i} className="group relative h-16 w-16 rounded-md overflow-hidden border">
                        <Image
                          src={getImageUrl(path)}
                          alt={`Scraped ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        <button
                          type="button"
                          onClick={() => setScrapedImagePaths((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nom du produit *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Serum Vitamine C"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Categorie</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Skincare, Chaussures..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">USP (argument unique)</label>
              <Textarea
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="Qu'est-ce qui rend ce produit unique et irreplacable ?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Positionnement</label>
                <Input
                  value={positioning}
                  onChange={(e) => setPositioning(e.target.value)}
                  placeholder="Ex: Premium, Mass market..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Audience cible</label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Femmes 25-40, CSP+..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Avantage concurrentiel</label>
              <Textarea
                value={competitiveAdvantage}
                onChange={(e) => setCompetitiveAdvantage(e.target.value)}
                placeholder="Pourquoi choisir ce produit plutot qu'un concurrent ?"
                rows={2}
              />
            </div>

            <ArrayFieldEditor
              label="Benefices cles"
              placeholder="Benefice"
              values={benefits}
              setter={setBenefits}
            />

            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold mb-3">Arguments marketing</h4>

              <div className="space-y-3">
                <ArrayFieldEditor
                  label="Headlines / Accroches"
                  placeholder="Headline"
                  values={headlines}
                  setter={setHeadlines}
                />
                <ArrayFieldEditor
                  label="Hooks (phrases d'accroche)"
                  placeholder="Hook"
                  values={hooks}
                  setter={setHooks}
                />
                <ArrayFieldEditor
                  label="Call to Actions"
                  placeholder="CTA"
                  values={callToActions}
                  setter={setCallToActions}
                />
                <ArrayFieldEditor
                  label="Triggers emotionnels"
                  placeholder="Trigger"
                  values={emotionalTriggers}
                  setter={setEmotionalTriggers}
                />
                <ArrayFieldEditor
                  label="Preuves sociales"
                  placeholder="Preuve"
                  values={socialProof}
                  setter={setSocialProof}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Creer le produit
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === product.id ? null : product.id)
                }
              >
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
            </div>

            {/* Expanded view */}
            {expandedId === product.id && editingId !== product.id && (
              <div className="border-t pt-3 space-y-3">
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

                  {/* Analyze URL input */}
                  {!product.productAnalysis && (
                    <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-400">
                        URL produit pour analyse IA
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={analyzeUrl[product.id] || ""}
                          onChange={(e) =>
                            setAnalyzeUrl((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                          placeholder="https://example.com/produit"
                          className="text-sm"
                        />
                        <Button
                          onClick={() => handleAnalyzeProduct(product.id)}
                          disabled={analyzingProductId === product.id || !analyzeUrl[product.id]?.trim()}
                          variant="default"
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {analyzingProductId === product.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Brain className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Analyser
                        </Button>
                      </div>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">
                        Genere FAB, USP, DUR, objections, arguments de vente via Claude AI
                      </p>
                    </div>
                  )}

                  {/* Show Analysis Button + Panel */}
                  {product.productAnalysis && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
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
                          variant={showAnglesFor === product.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!productAngles[product.id]) {
                              handleGenerateAngles(product.id);
                            } else {
                              setShowAnglesFor(showAnglesFor === product.id ? null : product.id);
                            }
                          }}
                          disabled={generatingAnglesFor === product.id}
                        >
                          {generatingAnglesFor === product.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {productAngles[product.id]
                            ? showAnglesFor === product.id
                              ? "Masquer angles"
                              : "Voir angles EPIC"
                            : "Generer angles EPIC"}
                        </Button>
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

                      {/* Angles Panel */}
                      {showAnglesFor === product.id && productAngles[product.id] && (
                        <div className="mt-3">
                          <AnglesPanel
                            anglesData={productAngles[product.id]}
                            productName={product.name}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
