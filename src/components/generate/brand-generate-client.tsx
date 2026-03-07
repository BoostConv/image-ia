"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FormatSelector, FormatMultiSelector } from "./format-selector";
import { GenerationGrid } from "./generation-grid";
import { FORMAT_PRESETS } from "@/lib/ai/prompt-templates";
import {
  Sparkles,
  Loader2,
  Brain,
  Zap,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
  BookOpen,
  Megaphone,
  FileText,
  LayoutGrid,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  } | null;
  typography: {
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
  } | null;
  [key: string]: unknown;
}

interface Product {
  id: string;
  name: string;
  usp: string | null;
  benefits: string[] | null;
  [key: string]: unknown;
}

interface Persona {
  id: string;
  name: string;
  description: string | null;
  promptModifiers: string | null;
  visualStyle: {
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType?: string;
    decorStyle?: string;
  } | null;
  [key: string]: unknown;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  concept?: string;
  angle?: string;
  level?: string;
  emotion?: string;
}

interface Concept {
  concept: string;
  angle: string;
  level: string;
  emotion: string;
}

interface BrandGenerateClientProps {
  brand: Brand;
  products: Product[];
  personas: Persona[];
  guidelinesPrompt: string;
  guidelinesCount: number;
  documentsPrompt: string;
  inspirationPrompt: string;
}

const BATCH_COUNTS = [1, 3, 5, 10, 15, 20, 30, 50];

type GenerationMode = "visual" | "ad";

export function BrandGenerateClient({
  brand,
  products,
  personas,
  guidelinesPrompt,
  guidelinesCount,
  documentsPrompt,
  inspirationPrompt,
}: BrandGenerateClientProps) {
  const [mode, setMode] = useState<GenerationMode>("ad");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [selectedFormatId, setSelectedFormatId] = useState("feed_square");
  const [selectedFormatIds, setSelectedFormatIds] = useState<Set<string>>(new Set(["feed_square"]));
  const [multiFormatMode, setMultiFormatMode] = useState(false);
  const [brief, setBrief] = useState("");
  const [batchCount, setBatchCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    productId: string | null;
    personaId: string | null;
    format: string | null;
    aspectRatio: string | null;
    brief: string | null;
    batchCount: number | null;
  }>>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Brief auto extraction
  const [isExtractingBrief, setIsExtractingBrief] = useState(false);
  const [extractedConstraints, setExtractedConstraints] = useState<{
    productFocus?: string;
    targetAudience?: string;
    tone?: string;
    constraints?: string[];
    suggestedFormats?: string[];
    doNots?: string[];
    keyMessage?: string;
  } | null>(null);

  // Batch progress
  const [phase, setPhase] = useState<string>("");
  const [phaseMessage, setPhaseMessage] = useState<string>("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentConcept, setCurrentConcept] = useState<string>("");
  const [batchStats, setBatchStats] = useState({ completed: 0, failed: 0 });

  const abortRef = useRef<AbortController | null>(null);

  const selectedFormat = FORMAT_PRESETS.find((f) => f.id === selectedFormatId);

  // Load templates on mount
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates?brandId=${brand.id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch { /* ignore */ }
  }, [brand.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { loadTemplates(); });

  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          name: templateName,
          productId: selectedProductId || null,
          personaId: selectedPersonaId || null,
          format: selectedFormatId,
          aspectRatio: selectedFormat?.aspectRatio || "1:1",
          brief: brief || null,
          batchCount,
        }),
      });
      if (res.ok) {
        setShowSaveTemplate(false);
        setTemplateName("");
        await loadTemplates();
      }
    } catch { /* ignore */ }
    setIsSavingTemplate(false);
  }, [brand.id, templateName, selectedProductId, selectedPersonaId, selectedFormatId, selectedFormat, brief, batchCount, loadTemplates]);

  const handleLoadTemplate = useCallback((tpl: typeof templates[0]) => {
    if (tpl.productId) setSelectedProductId(tpl.productId);
    if (tpl.personaId) setSelectedPersonaId(tpl.personaId);
    if (tpl.format) setSelectedFormatId(tpl.format);
    if (tpl.brief) setBrief(tpl.brief);
    if (tpl.batchCount) setBatchCount(tpl.batchCount);
  }, []);

  // Brief auto extraction
  const handleExtractBrief = useCallback(async () => {
    if (!brief.trim()) return;
    setIsExtractingBrief(true);
    try {
      const res = await fetch("/api/briefs/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawBrief: brief }),
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedConstraints(data);
        // Auto-select suggested format if available
        if (data.suggestedFormats?.length) {
          const suggested = FORMAT_PRESETS.find((f) => data.suggestedFormats.includes(f.id));
          if (suggested) setSelectedFormatId(suggested.id);
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsExtractingBrief(false);
    }
  }, [brief]);

  const handleBatchGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setPhase("starting");
    setPhaseMessage("Demarrage...");
    setConcepts([]);
    setProgress({ current: 0, total: batchCount });
    setCurrentConcept("");
    setBatchStats({ completed: 0, failed: 0 });

    abortRef.current = new AbortController();

    // Choose endpoint based on mode
    const endpoint = mode === "ad" ? "/api/generate-ad" : "/api/generate-batch";

    // Determine formats to generate
    const formatsToGenerate = multiFormatMode
      ? Array.from(selectedFormatIds).map((id) => {
          const preset = FORMAT_PRESETS.find((f) => f.id === id);
          return { id, aspectRatio: preset?.aspectRatio || "1:1" };
        })
      : [{ id: selectedFormatId, aspectRatio: selectedFormat?.aspectRatio || "1:1" }];

    for (const fmt of formatsToGenerate) {
      if (abortRef.current?.signal.aborted) break;

      if (formatsToGenerate.length > 1) {
        const fmtLabel = FORMAT_PRESETS.find((f) => f.id === fmt.id)?.label || fmt.id;
        setPhaseMessage(`Format : ${fmtLabel} (${fmt.aspectRatio})`);
      }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          productId: selectedProductId || undefined,
          personaId: selectedPersonaId || undefined,
          brief: brief || undefined,
          format: fmt.id,
          aspectRatio: fmt.aspectRatio,
          count: batchCount,
        }),
        signal: abortRef.current!.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la generation");
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError("Pas de stream disponible");
        setIsGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "phase":
                setPhase(event.phase);
                setPhaseMessage(event.message);
                break;

              case "concepts":
                setConcepts(event.concepts);
                break;

              case "progress":
                setProgress({ current: event.current, total: event.total });
                if (event.concept) setCurrentConcept(event.concept);
                break;

              case "image":
                setGeneratedImages((prev) => [
                  {
                    id: event.id,
                    url: event.url,
                    prompt: event.concept || "",
                    concept: event.concept,
                    angle: event.angle || event.layout,
                    level: event.level,
                    emotion: event.emotion,
                  },
                  ...prev,
                ]);
                setBatchStats((s) => ({ ...s, completed: s.completed + 1 }));
                break;

              case "error":
                setBatchStats((s) => ({ ...s, failed: s.failed + 1 }));
                break;

              case "complete":
                setPhase("complete");
                setPhaseMessage(
                  `Termine ! ${event.completed} visuels generes${event.failed > 0 ? `, ${event.failed} echecs` : ""}`
                );
                break;

              case "fatal_error":
                setError(event.error);
                break;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    }
    } // end formatsToGenerate loop

    setIsGenerating(false);
    abortRef.current = null;

    if (formatsToGenerate.length > 1) {
      setPhase("complete");
      setPhaseMessage(`Multi-format termine !`);
    }
  }, [brand.id, selectedProductId, selectedPersonaId, brief, selectedFormatId, selectedFormat, batchCount, mode, multiFormatMode, selectedFormatIds]);

  function handleCancel() {
    abortRef.current?.abort();
    setIsGenerating(false);
    setPhase("");
  }

  const contextCount = [
    guidelinesCount > 0 && "guidelines",
    documentsPrompt && "documents",
    inspirationPrompt && "inspirations",
  ].filter(Boolean).length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel: Config */}
      <div className="w-80 shrink-0 overflow-y-auto border-r p-4 space-y-4">
        {/* Mode toggle: Visual vs Ad */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mode de generation
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setMode("ad")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                mode === "ad"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Ads
            </button>
            <button
              onClick={() => setMode("visual")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                mode === "visual"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Visuels
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {mode === "ad"
              ? "Cree de vraies pubs avec texte, produit et CTA"
              : "Genere des visuels bruts sans texte ni composition"}
          </p>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <LayoutGrid className="h-3 w-3" />
              Templates
            </label>
            <Select onValueChange={(id) => {
              const tpl = templates.find(t => t.id === id);
              if (tpl) handleLoadTemplate(tpl);
            }}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Charger un template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Product selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Produit</label>
          {products.length > 0 ? (
            <Select
              value={selectedProductId}
              onValueChange={(v) => setSelectedProductId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <a
              href={`/brands/${brand.id}/settings`}
              className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
            >
              + Ajouter un produit
            </a>
          )}
        </div>

        {/* Persona selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Persona</label>
          {personas.length > 0 ? (
            <Select
              value={selectedPersonaId}
              onValueChange={(v) => setSelectedPersonaId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un persona" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <a
              href={`/brands/${brand.id}/settings`}
              className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
            >
              + Ajouter un persona
            </a>
          )}
        </div>

        <Separator />

        {/* Format selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Format</label>
            <button
              onClick={() => setMultiFormatMode(!multiFormatMode)}
              className="text-[10px] text-primary hover:underline"
            >
              {multiFormatMode ? "Format unique" : "Multi-format"}
            </button>
          </div>
          {multiFormatMode ? (
            <>
              <FormatMultiSelector
                selected={selectedFormatIds}
                onToggle={(id) => {
                  setSelectedFormatIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) {
                      if (next.size > 1) next.delete(id);
                    } else {
                      next.add(id);
                    }
                    return next;
                  });
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                {selectedFormatIds.size} format(s) — {batchCount} concepts x {selectedFormatIds.size} formats = {batchCount * selectedFormatIds.size} images
              </p>
            </>
          ) : (
            <>
              <FormatSelector
                selected={selectedFormatId}
                onSelect={setSelectedFormatId}
              />
              {selectedFormat && (
                <Badge variant="outline" className="text-xs">
                  {selectedFormat.aspectRatio}
                </Badge>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Brief with auto extraction */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Brief
          </label>
          <Textarea
            value={brief}
            onChange={(e) => {
              setBrief(e.target.value);
              setExtractedConstraints(null);
            }}
            placeholder="Collez votre brief ici... Ex: Campagne de lancement ete 2025, focus sur la fraicheur, format story et feed, cible femmes 25-35 CSP+, promesse zero sucre..."
            rows={4}
            className="text-sm"
          />
          {brief.trim().length > 20 && !extractedConstraints && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={handleExtractBrief}
              disabled={isExtractingBrief}
            >
              {isExtractingBrief ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Brain className="mr-1.5 h-3 w-3" />
              )}
              Extraire les contraintes avec l'IA
            </Button>
          )}
          {extractedConstraints && (
            <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 p-2.5 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Contraintes extraites
              </div>
              {extractedConstraints.keyMessage && (
                <p className="font-medium text-foreground">{extractedConstraints.keyMessage}</p>
              )}
              {extractedConstraints.tone && (
                <p><span className="text-muted-foreground">Ton :</span> {extractedConstraints.tone}</p>
              )}
              {extractedConstraints.targetAudience && (
                <p><span className="text-muted-foreground">Cible :</span> {extractedConstraints.targetAudience}</p>
              )}
              {extractedConstraints.constraints?.length ? (
                <div className="flex flex-wrap gap-1">
                  {extractedConstraints.constraints.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">{c}</Badge>
                  ))}
                </div>
              ) : null}
              {extractedConstraints.doNots?.length ? (
                <div className="flex flex-wrap gap-1">
                  {extractedConstraints.doNots.map((d, i) => (
                    <Badge key={i} variant="destructive" className="text-[9px]">{d}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <Separator />

        {/* Batch count */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre de visuels</label>
          <div className="grid grid-cols-4 gap-1.5">
            {BATCH_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setBatchCount(n)}
                className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  batchCount === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Cout estime : ~{(batchCount * 0.134).toFixed(2)}$ (images) + Claude
          </p>
        </div>

        <Separator />

        {/* Context indicators */}
        {contextCount > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contexte injecte
            </label>
            {guidelinesCount > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-700 dark:text-blue-300">
                <Shield className="h-3 w-3 shrink-0" />
                {guidelinesCount} guidelines actives
              </div>
            )}
            {documentsPrompt && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-2.5 py-1.5 text-xs text-green-700 dark:text-green-300">
                <BookOpen className="h-3 w-3 shrink-0" />
                Documents de marque
              </div>
            )}
            {inspirationPrompt && (
              <div className="flex items-center gap-2 rounded-md bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-700 dark:text-purple-300">
                <Sparkles className="h-3 w-3 shrink-0" />
                Inspirations publicitaires
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Generate button */}
        {isGenerating ? (
          <Button
            className="w-full"
            size="lg"
            variant="destructive"
            onClick={handleCancel}
          >
            Annuler
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleBatchGenerate}
            disabled={isGenerating}
          >
            {mode === "ad" ? (
              <Megaphone className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generer {batchCount} {mode === "ad" ? "ads" : "visuels"}
          </Button>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Save as template */}
        {!isGenerating && (
          <div className="space-y-2">
            {showSaveTemplate ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nom du template..."
                  className="flex-1 rounded-md border px-2 py-1.5 text-xs bg-background"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || isSavingTemplate}
                  className="text-xs h-7 px-2"
                >
                  {isSavingTemplate ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSaveTemplate(false)}
                  className="text-xs h-7 px-2"
                >
                  X
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveTemplate(true)}
                className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Sauvegarder comme template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Progress + Results */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Batch progress */}
        {phase && phase !== "complete" && (
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-4">
              {/* Phase indicator */}
              <div className="flex items-center gap-3">
                {phase === "ideation" || phase === "art_direction" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
                  </div>
                ) : phase === "generation" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <ImageIcon className="h-5 w-5 text-blue-600 animate-pulse" />
                  </div>
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <div>
                  <p className="text-sm font-medium">{phaseMessage}</p>
                  {progress.total > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {progress.current}/{progress.total} visuels
                      {batchStats.failed > 0 && ` (${batchStats.failed} echecs)`}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {progress.total > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Current concept */}
              {currentConcept && (
                <p className="text-xs text-muted-foreground italic">
                  {currentConcept}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed banner */}
        {phase === "complete" && (
          <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {phaseMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Concepts list (shown during ideation) */}
        {concepts.length > 0 && phase !== "complete" && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Concepts generes par Claude ({concepts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {concepts.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
                    progress.current > i
                      ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                      : progress.current === i
                        ? "border-primary/30 bg-primary/5"
                        : "border-muted"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {progress.current > i ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : progress.current === i ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{c.concept}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {c.angle}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {c.level}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        {c.emotion}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Results grid */}
        {generatedImages.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Visuels generes ({generatedImages.length})
            </h2>
            <GenerationGrid images={generatedImages} />
          </div>
        )}

        {/* Empty state */}
        {!isGenerating && generatedImages.length === 0 && !phase && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Pret a generer</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Selectionnez un produit et un persona, ajoutez un brief optionnel,
              choisissez le nombre de visuels et lancez la generation.
              Claude creera les concepts creatifs et Nano Banana generera les images.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
