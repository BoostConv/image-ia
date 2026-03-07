"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatSelector } from "./format-selector";
import { PromptLayerEditor } from "./prompt-layer-editor";
import { GenerationGrid } from "./generation-grid";
import { FORMAT_PRESETS, FORMAT_TEMPLATES } from "@/lib/ai/prompt-templates";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
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
  [key: string]: unknown;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export function GenerateClient({ brands }: { brands: Brand[] }) {
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedFormatId, setSelectedFormatId] = useState("feed_square");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Prompt layers
  const [layers, setLayers] = useState({
    brand: "",
    persona: "",
    brief: "",
    format: "",
    custom: "",
  });

  // Layer toggles
  const [enabledLayers, setEnabledLayers] = useState({
    brand: true,
    persona: true,
    brief: true,
    format: true,
    custom: true,
  });

  const selectedFormat = FORMAT_PRESETS.find((f) => f.id === selectedFormatId);

  const compiledPrompt = Object.entries(layers)
    .filter(
      ([key, value]) =>
        enabledLayers[key as keyof typeof enabledLayers] && value.trim()
    )
    .map(([, value]) => value.trim())
    .join("\n\n");

  async function handleGenerate() {
    if (!compiledPrompt.trim()) {
      setError("Ecrivez un prompt ou activez au moins une couche.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: compiledPrompt,
          format: selectedFormatId,
          aspectRatio: selectedFormat?.aspectRatio || "1:1",
          brandId: selectedBrandId || undefined,
          promptLayers: layers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la generation");
        return;
      }

      setGeneratedImages((prev) => [
        ...data.images.map((img: { id: string; url: string }) => ({
          id: img.id,
          url: img.url,
          prompt: compiledPrompt,
        })),
        ...prev,
      ]);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setIsGenerating(false);
    }
  }

  function updateLayer(key: keyof typeof layers, value: string) {
    setLayers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLayer(key: keyof typeof enabledLayers) {
    setEnabledLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel: Config */}
      <div className="w-80 shrink-0 overflow-y-auto border-r p-4 space-y-4">
        {/* Brand selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Marque</label>
          <Select value={selectedBrandId} onValueChange={(v) => setSelectedBrandId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selectionner une marque" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  <div className="flex items-center gap-2">
                    {brand.colorPalette && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: brand.colorPalette.primary,
                        }}
                      />
                    )}
                    {brand.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Format selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <FormatSelector
            selected={selectedFormatId}
            onSelect={(id) => {
              setSelectedFormatId(id);
              updateLayer("format", FORMAT_TEMPLATES[id] || "");
            }}
          />
          {selectedFormat && (
            <Badge variant="outline" className="text-xs">
              {selectedFormat.aspectRatio}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Generate button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || !compiledPrompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generation en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generer
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Center Panel: Prompt Builder + Results */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList>
            <TabsTrigger value="prompt">Prompt Builder</TabsTrigger>
            <TabsTrigger value="results">
              Resultats ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            {/* Prompt layers */}
            <div className="space-y-3">
              <PromptLayerEditor
                label="Marque"
                layerKey="brand"
                value={layers.brand}
                enabled={enabledLayers.brand}
                onChange={(v) => updateLayer("brand", v)}
                onToggle={() => toggleLayer("brand")}
                color="blue"
              />
              <PromptLayerEditor
                label="Persona"
                layerKey="persona"
                value={layers.persona}
                enabled={enabledLayers.persona}
                onChange={(v) => updateLayer("persona", v)}
                onToggle={() => toggleLayer("persona")}
                color="purple"
              />
              <PromptLayerEditor
                label="Brief"
                layerKey="brief"
                value={layers.brief}
                enabled={enabledLayers.brief}
                onChange={(v) => updateLayer("brief", v)}
                onToggle={() => toggleLayer("brief")}
                color="green"
              />
              <PromptLayerEditor
                label="Format"
                layerKey="format"
                value={layers.format}
                enabled={enabledLayers.format}
                onChange={(v) => updateLayer("format", v)}
                onToggle={() => toggleLayer("format")}
                color="orange"
              />
              <PromptLayerEditor
                label="Instructions personnalisees"
                layerKey="custom"
                value={layers.custom}
                enabled={enabledLayers.custom}
                onChange={(v) => updateLayer("custom", v)}
                onToggle={() => toggleLayer("custom")}
                color="pink"
              />
            </div>

            {/* Prompt preview */}
            <Card>
              <CardHeader
                className="cursor-pointer py-3"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Apercu du prompt compile
                  </CardTitle>
                  {showPromptPreview ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {showPromptPreview && (
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                    {compiledPrompt || "(aucune couche active)"}
                  </pre>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <GenerationGrid images={generatedImages} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
