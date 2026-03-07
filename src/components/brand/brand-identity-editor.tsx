"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Loader2, Globe, Sparkles, Target, Eye, MessageSquare, Heart, Users } from "lucide-react";

interface BrandIdentity {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  vision: string | null;
  positioning: string | null;
  tone: string | null;
  values: string[] | null;
  targetMarket: string | null;
  websiteUrl: string | null;
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
  const [primaryColor, setPrimaryColor] = useState(brand.colorPalette?.primary || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(brand.colorPalette?.secondary || "#666666");
  const [accentColor, setAccentColor] = useState(brand.colorPalette?.accent || "#0066ff");
  const [headingFont, setHeadingFont] = useState(brand.typography?.headingFont || "");
  const [bodyFont, setBodyFont] = useState(brand.typography?.bodyFont || "");

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

          {websiteUrl && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Site web</label>
              <p className="text-sm text-muted-foreground">{websiteUrl}</p>
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
        {/* Website URL + Scrape button */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Site web de la marque
          </label>
          <div className="flex gap-2">
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.example.com"
            />
            <Button
              onClick={handleScrape}
              disabled={isScraping || !websiteUrl.trim()}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              {isScraping ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              Analyser le site
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            L&apos;IA analyse le site pour extraire mission, vision, positionnement, couleurs, polices et ton
          </p>

          {/* Scrape result feedback */}
          {scrapeResult && (
            <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800 space-y-2">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Analyse terminee — champs pre-remplis
              </p>
              {scrapeResult.positioning && (
                <p className="text-[11px] text-green-600">
                  <span className="font-medium">Positionnement :</span> {scrapeResult.positioning}
                </p>
              )}
              {scrapeResult.tone && (
                <p className="text-[11px] text-green-600">
                  <span className="font-medium">Ton :</span> {scrapeResult.tone}
                </p>
              )}
              {scrapeResult.keyMessages?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {scrapeResult.keyMessages.map((msg, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">
                      {msg}
                    </Badge>
                  ))}
                </div>
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
