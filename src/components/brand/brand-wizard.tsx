"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  X,
} from "lucide-react";

const STEPS = [
  "Informations",
  "Couleurs & Typo",
  "Produit",
  "Persona",
  "Finaliser",
];

export function BrandWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Brand info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Step 2: Colors & Typography
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#6366F1");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  const [headingFont, setHeadingFont] = useState("");
  const [bodyFont, setBodyFont] = useState("");

  // Step 3: Product
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productUsp, setProductUsp] = useState("");
  const [productBenefits, setProductBenefits] = useState<string[]>([""]);
  const [productPositioning, setProductPositioning] = useState("");

  // Step 4: Persona
  const [personaName, setPersonaName] = useState("");
  const [personaDescription, setPersonaDescription] = useState("");
  const [personaAgeRange, setPersonaAgeRange] = useState("");
  const [personaColorTone, setPersonaColorTone] = useState("");
  const [personaPhotoStyle, setPersonaPhotoStyle] = useState("");
  const [personaLighting, setPersonaLighting] = useState("");

  function addBenefit() {
    setProductBenefits((prev) => [...prev, ""]);
  }

  function removeBenefit(index: number) {
    setProductBenefits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBenefit(index: number, value: string) {
    setProductBenefits((prev) =>
      prev.map((b, i) => (i === index ? value : b))
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          websiteUrl: websiteUrl || undefined,
          colorPalette: {
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor,
            neutrals: ["#F3F4F6", "#9CA3AF", "#374151"],
          },
          typography: {
            headingFont: headingFont || "Inter",
            bodyFont: bodyFont || "Inter",
          },
          product:
            productName
              ? {
                  name: productName,
                  category: productCategory || undefined,
                  usp: productUsp || undefined,
                  benefits: productBenefits.filter(Boolean),
                  positioning: productPositioning || undefined,
                }
              : undefined,
          persona:
            personaName
              ? {
                  name: personaName,
                  description: personaDescription || undefined,
                  demographics: {
                    ageRange: personaAgeRange || "25-45",
                  },
                  visualStyle: {
                    colorTone: personaColorTone || "neutre",
                    photographyStyle: personaPhotoStyle || "lifestyle",
                    lightingPreference: personaLighting || "naturel",
                    compositionNotes: "",
                  },
                }
              : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/brands/${data.id}/generate`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Nom de la marque *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nike, Apple, Boost Conversion..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Decrivez l'univers de la marque, son positionnement..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Site web</Label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Palette de couleurs</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Primaire
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Secondaire
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Accent
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Police titres</Label>
                  <Input
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    placeholder="Ex: Montserrat, Playfair Display..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Police corps</Label>
                  <Input
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    placeholder="Ex: Inter, Open Sans..."
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Ajoutez un produit pour enrichir vos prompts (optionnel)
              </p>
              <div className="space-y-2">
                <Label>Nom du produit</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Serum Vitamine C, Sneakers Air Max..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="Ex: Skincare, Chaussures..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Positionnement</Label>
                  <Input
                    value={productPositioning}
                    onChange={(e) => setProductPositioning(e.target.value)}
                    placeholder="Ex: Premium, Mass market..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>USP (argument unique)</Label>
                <Textarea
                  value={productUsp}
                  onChange={(e) => setProductUsp(e.target.value)}
                  placeholder="Qu'est-ce qui rend ce produit unique ?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Benefices cles</Label>
                {productBenefits.map((benefit, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(i, e.target.value)}
                      placeholder={`Benefice ${i + 1}`}
                    />
                    {productBenefits.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBenefit}>
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter un benefice
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Definissez un persona pour adapter le style visuel (optionnel)
              </p>
              <div className="space-y-2">
                <Label>Nom du persona</Label>
                <Input
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="Ex: Marie la sportive, Thomas le geek..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  placeholder="Decrivez ce persona : mode de vie, valeurs, aspirations..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tranche d&apos;age</Label>
                  <Input
                    value={personaAgeRange}
                    onChange={(e) => setPersonaAgeRange(e.target.value)}
                    placeholder="Ex: 25-35"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ton de couleur</Label>
                  <Input
                    value={personaColorTone}
                    onChange={(e) => setPersonaColorTone(e.target.value)}
                    placeholder="Ex: chaud, froid, vibrant, doux"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style photo</Label>
                  <Input
                    value={personaPhotoStyle}
                    onChange={(e) => setPersonaPhotoStyle(e.target.value)}
                    placeholder="Ex: editorial, lifestyle, minimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eclairage</Label>
                  <Input
                    value={personaLighting}
                    onChange={(e) => setPersonaLighting(e.target.value)}
                    placeholder="Ex: naturel, studio, golden hour"
                  />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Recapitulatif</h3>
              <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
                <div>
                  <span className="font-medium">Marque :</span> {name}
                </div>
                {description && (
                  <div>
                    <span className="font-medium">Description :</span>{" "}
                    {description}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Couleurs :</span>
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
                {productName && (
                  <div>
                    <span className="font-medium">Produit :</span>{" "}
                    {productName}
                    {productUsp && ` — ${productUsp}`}
                  </div>
                )}
                {personaName && (
                  <div>
                    <span className="font-medium">Persona :</span>{" "}
                    {personaName}
                    {personaDescription && ` — ${personaDescription}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Precedent
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !name.trim()}
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
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
