"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Globe,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import type {
  IdentiteFondamentale,
  PositionnementStrategique,
  TonCommunication,
  BriefMetadata,
  BriefStatus,
} from "@/lib/db/schema";
import { IdentiteEditor } from "./brief-editor/identite-editor";
import { PositionnementEditor } from "./brief-editor/positionnement-editor";
import { TonEditor } from "./brief-editor/ton-editor";
import { GapWarnings, ConfidenceBadge } from "./brief-editor/gap-warnings";

// ============================================================
// BRAND WIZARD V2 — Auto-generation AI Brief
// 3 Steps: Identify → Review & Edit → Finalize
// ============================================================

const STEPS = ["Identifier", "Editer le brief", "Finaliser"];

interface GeneratedBrief {
  identiteFondamentale: IdentiteFondamentale;
  positionnementStrategique: PositionnementStrategique;
  tonCommunication: TonCommunication;
  metadata: BriefMetadata;
  status: BriefStatus;
}

interface ScrapedPreview {
  siteName?: string;
  description?: string;
  tagline?: string;
  colorsExtracted?: string[];
  fontsExtracted?: string[];
}

export function BrandWizardV2() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: Identification
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Step 2: Brief data
  const [brief, setBrief] = useState<GeneratedBrief | null>(null);
  const [scrapedPreview, setScrapedPreview] = useState<ScrapedPreview | null>(null);

  // Step 3: Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progress messages for generation
  const [progressMessage, setProgressMessage] = useState("");

  async function handleGenerateBrief() {
    if (!name.trim() || !websiteUrl.trim()) return;

    setIsGenerating(true);
    setGenerateError(null);
    setProgressMessage("Analyse du site web en cours...");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgressMessage((prev) => {
          const messages = [
            "Analyse du site web en cours...",
            "Extraction des couleurs et polices...",
            "Analyse du contenu textuel...",
            "Recherche des pages 'A propos'...",
            "Generation du brief strategique...",
            "Validation des informations...",
          ];
          const currentIndex = messages.indexOf(prev);
          return messages[(currentIndex + 1) % messages.length];
        });
      }, 2000);

      const response = await fetch("/api/brands/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, websiteUrl }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la generation");
      }

      const data = await response.json();
      setBrief(data.brief);
      setScrapedPreview(data.scrapedPreview);
      setStep(1);
    } catch (error) {
      setGenerateError((error as Error).message);
    } finally {
      setIsGenerating(false);
      setProgressMessage("");
    }
  }

  async function handleSubmit() {
    if (!brief) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          websiteUrl,
          // Extract basic info from brief for backward compat
          description: brief.positionnementStrategique.propositionValeur,
          mission: brief.identiteFondamentale.mission,
          vision: brief.identiteFondamentale.vision,
          positioning: brief.positionnementStrategique.elementDistinctif,
          tone: brief.tonCommunication.tonDominant.join(", "),
          values: brief.identiteFondamentale.valeurs.map((v) => v.name),
          // New V1 brief fields
          identiteFondamentale: brief.identiteFondamentale,
          positionnementStrategique: brief.positionnementStrategique,
          tonCommunication: brief.tonCommunication,
          briefMetadata: brief.metadata,
          briefStatus: brief.status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/brands/${data.id}/generate`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la creation");
      }
    } catch (error) {
      console.error(error);
      setGenerateError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateIdentite(value: IdentiteFondamentale) {
    if (brief) {
      setBrief({ ...brief, identiteFondamentale: value });
    }
  }

  function updatePositionnement(value: PositionnementStrategique) {
    if (brief) {
      setBrief({ ...brief, positionnementStrategique: value });
    }
  }

  function updateTon(value: TonCommunication) {
    if (brief) {
      setBrief({ ...brief, tonCommunication: value });
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span
              className={`text-xs hidden sm:inline ${
                i === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Identification */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Identifier votre marque
            </CardTitle>
            <CardDescription>
              Entrez le nom de votre marque et l&apos;URL de votre site web. Notre IA
              analysera automatiquement votre site pour generer un brief strategique
              complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la marque *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nike, Apple, Rebelle..."
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Site web *</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://votre-site.com"
                type="url"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Notre IA analysera la page d&apos;accueil ainsi que les pages &quot;A
                propos&quot; et &quot;Notre histoire&quot; si elles existent.
              </p>
            </div>

            {generateError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{generateError}</p>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium text-sm">{progressMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    Cela peut prendre jusqu&apos;a 30 secondes...
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerateBrief}
              disabled={!name.trim() || !websiteUrl.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generation en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generer le brief avec l&apos;IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Edit Brief */}
      {step === 1 && brief && (
        <div className="space-y-6">
          {/* Brief Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Brief strategique — {name}
                </CardTitle>
                <ConfidenceBadge confidence={brief.metadata.confidence} />
              </div>
              {scrapedPreview && (
                <CardDescription>
                  Analyse basee sur {scrapedPreview.siteName || websiteUrl}
                  {scrapedPreview.tagline && ` — "${scrapedPreview.tagline}"`}
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* Gaps Panel */}
          {brief.metadata.gaps.length > 0 && (
            <GapWarnings gaps={brief.metadata.gaps} />
          )}

          {/* Editors */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <IdentiteEditor
                value={brief.identiteFondamentale}
                onChange={updateIdentite}
                sources={brief.metadata.sources}
              />
            </div>
            <div className="space-y-6">
              <PositionnementEditor
                value={brief.positionnementStrategique}
                onChange={updatePositionnement}
                sources={brief.metadata.sources}
              />
              <TonEditor
                value={brief.tonCommunication}
                onChange={updateTon}
                sources={brief.metadata.sources}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Finalize */}
      {step === 2 && brief && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Recapitulatif
            </CardTitle>
            <CardDescription>
              Verifiez les informations avant de creer la marque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div>
                <span className="font-medium">Marque :</span> {name}
              </div>
              <div>
                <span className="font-medium">Site :</span> {websiteUrl}
              </div>
              <div>
                <span className="font-medium">Vision :</span>{" "}
                {brief.identiteFondamentale.vision || "(non definie)"}
              </div>
              <div>
                <span className="font-medium">Mission :</span>{" "}
                {brief.identiteFondamentale.mission || "(non definie)"}
              </div>
              <div>
                <span className="font-medium">Positionnement :</span>{" "}
                {brief.positionnementStrategique.positionnementPrix.niveau}
              </div>
              <div>
                <span className="font-medium">Ton :</span>{" "}
                {brief.tonCommunication.tonDominant.join(", ") || "(non defini)"}
              </div>
              <div>
                <span className="font-medium">Valeurs :</span>{" "}
                {brief.identiteFondamentale.valeurs
                  .map((v) => v.name)
                  .join(", ") || "(aucune)"}
              </div>
              <div>
                <span className="font-medium">Red Lines :</span>{" "}
                {brief.tonCommunication.redLines.length} interdits definis
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Statut du brief :</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  brief.status === "complete"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : brief.status === "incomplete"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                }`}
              >
                {brief.status === "complete"
                  ? "Complet"
                  : brief.status === "incomplete"
                    ? "Incomplet"
                    : "Brouillon"}
              </span>
            </div>

            {brief.metadata.gaps.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {brief.metadata.gaps.length} element
                    {brief.metadata.gaps.length > 1 ? "s" : ""} a completer
                  </p>
                  <p className="text-xs opacity-80">
                    Vous pourrez completer ces informations plus tard dans les
                    parametres de la marque.
                  </p>
                </div>
              </div>
            )}

            {generateError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{generateError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Precedent
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 || !brief}
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !brief}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Creer la marque
          </Button>
        )}
      </div>
    </div>
  );
}
