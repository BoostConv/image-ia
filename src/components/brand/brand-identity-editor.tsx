"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Loader2, Globe, Sparkles, Target, Eye, MessageSquare, Heart, Users, Upload, Instagram, Facebook, Zap, CheckCircle2, AlertCircle, SkipForward } from "lucide-react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/images/url";

interface AutoAnalysisStatus {
  website: "pending" | "running" | "done" | "error" | "skipped";
  instagram: "pending" | "running" | "done" | "error" | "skipped";
  metaAds: "pending" | "running" | "done" | "error" | "skipped";
  errors?: Record<string, string>;
  results?: {
    colorsFound?: number;
    fontsFound?: number;
    imagesDownloaded?: number;
    adsFound?: number;
  };
  startedAt: string;
  completedAt?: string;
}

interface BrandIdentity {
  id: string;
  name: string;
  description: string | null;
  logoPath: string | null;
  mission: string | null;
  vision: string | null;
  positioning: string | null;
  tone: string | null;
  values: string[] | null;
  targetMarket: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  facebookPageUrl: string | null;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  typography: {
    headingFont: string;
    bodyFont: string;
  } | null;
}

export function BrandIdentityEditor({
  brand,
}: {
  brand: BrandIdentity;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [currentLogoPath, setCurrentLogoPath] = useState(brand.logoPath);
  const [scrapeResult, setScrapeResult] = useState<{
    name: string;
    description: string;
    mission: string;
    vision: string;
    positioning: string;
    tone: string;
    values: string[];
    targetMarket: string;
    colorPalette: { primary: string; secondary: string; accent: string };
    typography: { headingFont: string; bodyFont: string };
    keyMessages: string[];
  } | null>(null);

  const [name, setName] = useState(brand.name);
  const [description, setDescription] = useState(brand.description || "");
  const [mission, setMission] = useState(brand.mission || "");
  const [vision, setVision] = useState(brand.vision || "");
  const [positioning, setPositioning] = useState(brand.positioning || "");
  const [tone, setTone] = useState(brand.tone || "");
  const [values, setValues] = useState(brand.values?.join(", ") || "");
  const [targetMarket, setTargetMarket] = useState(brand.targetMarket || "");
  const [websiteUrl, setWebsiteUrl] = useState(brand.websiteUrl || "");
  const [instagramHandle, setInstagramHandle] = useState(brand.instagramHandle || "");
  const [facebookPageUrl, setFacebookPageUrl] = useState(brand.facebookPageUrl || "");
  const [primaryColor, setPrimaryColor] = useState(brand.colorPalette?.primary || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(brand.colorPalette?.secondary || "#666666");
  const [accentColor, setAccentColor] = useState(brand.colorPalette?.accent || "#0066ff");
  const [headingFont, setHeadingFont] = useState(brand.typography?.headingFont || "");
  const [bodyFont, setBodyFont] = useState(brand.typography?.bodyFont || "");
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [autoAnalysisResult, setAutoAnalysisResult] = useState<{
    status: AutoAnalysisStatus;
    totalImages: number;
    newImages: number;
    hasDaFingerprint: boolean;
  } | null>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/brands/${brand.id}/logo`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLogoPath(data.logoPath);
      }
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleScrape() {
    if (!websiteUrl.trim()) return;
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/brands/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setScrapeResult(data);
        // Auto-fill fields with scraped data
        if (data.name && !name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.mission) setMission(data.mission);
        if (data.vision) setVision(data.vision);
        if (data.positioning) setPositioning(data.positioning);
        if (data.tone) setTone(data.tone);
        if (data.values?.length) setValues(data.values.join(", "));
        if (data.targetMarket) setTargetMarket(data.targetMarket);
        if (data.colorPalette) {
          setPrimaryColor(data.colorPalette.primary);
          setSecondaryColor(data.colorPalette.secondary);
          setAccentColor(data.colorPalette.accent);
        }
        if (data.typography) {
          setHeadingFont(data.typography.headingFont);
          setBodyFont(data.typography.bodyFont);
        }
      }
    } catch (err) {
      console.error("Brand scrape error:", err);
    } finally {
      setIsScraping(false);
    }
  }

  async function handleAutoAnalyze() {
    // Save sources first
    try {
      await fetch("/api/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: brand.id,
          websiteUrl: websiteUrl || null,
          instagramHandle: instagramHandle || null,
          facebookPageUrl: facebookPageUrl || null,
        }),
      });
    } catch {
      // Continue even if save fails
    }

    setIsAutoAnalyzing(true);
    setAutoAnalysisResult(null);
    try {
      const res = await fetch(`/api/brands/${brand.id}/auto-analyze`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAutoAnalysisResult(data);
        // Reload the page to show updated data
        if (data.status?.website === "done") {
          window.location.reload();
        }
      } else {
        const err = await res.json();
        setAutoAnalysisResult({
          status: {
            website: "error",
            instagram: "error",
            metaAds: "error",
            errors: { general: err.error || "Erreur inconnue" },
            startedAt: new Date().toISOString(),
          },
          totalImages: 0,
          newImages: 0,
          hasDaFingerprint: false,
        });
      }
    } catch (err) {
      console.error("Auto-analyze error:", err);
    } finally {
      setIsAutoAnalyzing(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const valuesArray = values
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const res = await fetch("/api/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: brand.id,
          name,
          description: description || null,
          mission: mission || null,
          vision: vision || null,
          positioning: positioning || null,
          tone: tone || null,
          values: valuesArray.length > 0 ? valuesArray : null,
          targetMarket: targetMarket || null,
          websiteUrl: websiteUrl || null,
          instagramHandle: instagramHandle || null,
          facebookPageUrl: facebookPageUrl || null,
          colorPalette: {
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor,
          },
          typography: headingFont || bodyFont ? {
            headingFont: headingFont || "Sans-serif",
            bodyFont: bodyFont || "Sans-serif",
          } : null,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        setScrapeResult(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setName(brand.name);
    setDescription(brand.description || "");
    setMission(brand.mission || "");
    setVision(brand.vision || "");
    setPositioning(brand.positioning || "");
    setTone(brand.tone || "");
    setValues(brand.values?.join(", ") || "");
    setTargetMarket(brand.targetMarket || "");
    setWebsiteUrl(brand.websiteUrl || "");
    setInstagramHandle(brand.instagramHandle || "");
    setFacebookPageUrl(brand.facebookPageUrl || "");
    setPrimaryColor(brand.colorPalette?.primary || "#000000");
    setSecondaryColor(brand.colorPalette?.secondary || "#666666");
    setAccentColor(brand.colorPalette?.accent || "#0066ff");
    setHeadingFont(brand.typography?.headingFont || "");
    setBodyFont(brand.typography?.bodyFont || "");
    setIsEditing(false);
    setScrapeResult(null);
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Identite de marque</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-1.5 h-3 w-3" />
            Modifier
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <label className="relative group cursor-pointer">
              {currentLogoPath ? (
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border">
                  <Image
                    src={getPublicImageUrl(currentLogoPath)}
                    alt="Logo"
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center hover:border-primary/50 transition-colors">
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
              />
            </label>
            <div>
              <p className="text-sm font-medium">{brand.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentLogoPath ? "Cliquez pour changer le logo" : "Ajouter un logo"}
              </p>
            </div>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}

          {/* Brand strategy section */}
          {(mission || vision || positioning || tone || (brand.values && brand.values.length > 0) || targetMarket) && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategie de marque</label>
              {mission && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Mission</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[18px]">{mission}</p>
                </div>
              )}
              {vision && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Vision</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[18px]">{vision}</p>
                </div>
              )}
              {positioning && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Positionnement</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[18px]">{positioning}</p>
                </div>
              )}
              {tone && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Ton</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[18px]">{tone}</p>
                </div>
              )}
              {brand.values && brand.values.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Valeurs</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-[18px]">
                    {brand.values.map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targetMarket && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Marche cible</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[18px]">{targetMarket}</p>
                </div>
              )}
            </div>
          )}

          {/* Visual identity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Palette</label>
            <div className="flex gap-3">
              {[
                { label: "Primaire", color: primaryColor },
                { label: "Secondaire", color: secondaryColor },
                { label: "Accent", color: accentColor },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <p className="text-xs font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(headingFont || bodyFont) && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Typographie</label>
              <p className="text-sm text-muted-foreground">
                Titres : {headingFont || "Non defini"} | Corps : {bodyFont || "Non defini"}
              </p>
            </div>
          )}

          {(websiteUrl || instagramHandle || facebookPageUrl) && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Sources</label>
              {websiteUrl && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> {websiteUrl}
                </p>
              )}
              {instagramHandle && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Instagram className="h-3 w-3" /> {instagramHandle}
                </p>
              )}
              {facebookPageUrl && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Facebook className="h-3 w-3" /> {facebookPageUrl}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-2 ring-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Modifier l&apos;identite</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
            <X className="mr-1 h-3 w-3" />
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3 w-3" />
            )}
            Sauvegarder
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sources & Auto-analyze */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-dashed">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Sources de la marque
          </label>

          {/* Website */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Site web
            </label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Instagram className="h-3 w-3" />
              Instagram
            </label>
            <Input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@nom_de_la_marque"
            />
          </div>

          {/* Facebook page */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Facebook className="h-3 w-3" />
              Page Facebook (Meta Ad Library)
            </label>
            <Input
              value={facebookPageUrl}
              onChange={(e) => setFacebookPageUrl(e.target.value)}
              placeholder="https://www.facebook.com/nom_de_la_marque"
            />
          </div>

          {/* Auto-analyze button */}
          <Button
            onClick={handleAutoAnalyze}
            disabled={isAutoAnalyzing || (!websiteUrl.trim() && !instagramHandle.trim() && !facebookPageUrl.trim())}
            variant="secondary"
            className="w-full"
          >
            {isAutoAnalyzing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-1.5 h-4 w-4" />
            )}
            {isAutoAnalyzing ? "Analyse en cours..." : "Analyser la marque"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            L&apos;IA scrape les sources, extrait couleurs, polices, visuels et analyse la direction artistique
          </p>

          {/* Auto-analyze result */}
          {autoAnalysisResult && (
            <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800 space-y-2">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Analyse terminee
              </p>
              <div className="space-y-1">
                {(["website", "instagram", "metaAds"] as const).map((source) => {
                  const st = autoAnalysisResult.status[source];
                  const label = source === "website" ? "Site web" : source === "instagram" ? "Instagram" : "Meta Ad Library";
                  return (
                    <div key={source} className="flex items-center gap-1.5 text-[11px]">
                      {st === "done" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : st === "error" ? (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      ) : st === "skipped" ? (
                        <SkipForward className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      <span className={st === "error" ? "text-red-600" : st === "skipped" ? "text-muted-foreground" : "text-green-600"}>
                        {label}: {st === "done" ? "OK" : st === "error" ? (autoAnalysisResult.status.errors?.[source] || "Erreur") : st === "skipped" ? "Non configure" : "..."}
                      </span>
                    </div>
                  );
                })}
              </div>
              {autoAnalysisResult.newImages > 0 && (
                <p className="text-[11px] text-green-600">
                  {autoAnalysisResult.newImages} visuels telecharges
                </p>
              )}
              {autoAnalysisResult.hasDaFingerprint && (
                <p className="text-[11px] text-green-600">
                  Fingerprint DA genere
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nom de la marque *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Decrivez la marque en quelques phrases..."
            rows={2}
          />
        </div>

        {/* Brand Strategy Section */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategie de marque</label>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              Mission
            </label>
            <Textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Pourquoi la marque existe ? Quel probleme resout-elle ?"
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Vision
            </label>
            <Textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Ou la marque veut aller ? Quel futur veut-elle creer ?"
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Positionnement
            </label>
            <Input
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              placeholder="Ex: Premium eco-responsable, Accessible et innovant..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Ton de communication
            </label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Ex: Chaleureux et expert, Decale et fun, Premium et sobre..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-primary" />
              Valeurs
            </label>
            <Input
              value={values}
              onChange={(e) => setValues(e.target.value)}
              placeholder="Separees par des virgules : Innovation, Durabilite, Excellence..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Marche cible
            </label>
            <Input
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              placeholder="Ex: Femmes 25-45 CSP+, Startups tech, Familles eco-responsables..."
            />
          </div>
        </div>

        {/* Visual Identity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Palette de couleurs</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Primaire", value: primaryColor, setter: setPrimaryColor },
              { label: "Secondaire", value: secondaryColor, setter: setSecondaryColor },
              { label: "Accent", value: accentColor, setter: setAccentColor },
            ].map((c) => (
              <div key={c.label} className="space-y-1">
                <label className="text-xs text-muted-foreground">{c.label}</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.setter(e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={c.value}
                    onChange={(e) => c.setter(e.target.value)}
                    className="text-xs h-8 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Police titres</label>
            <Input
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              placeholder="Ex: Montserrat, Playfair Display..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Police corps</label>
            <Input
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value)}
              placeholder="Ex: Inter, Open Sans..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
