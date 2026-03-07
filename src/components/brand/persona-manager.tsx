"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface Persona {
  id: string;
  name: string;
  description: string | null;
  demographics: {
    ageRange: string;
    gender?: string;
    location?: string;
    income?: string;
    lifestyle?: string;
  } | null;
  psychographics: {
    painPoints: string[];
    motivations: string[];
    aesthetic: string;
  } | null;
  visualStyle: {
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType?: string;
    decorStyle?: string;
  } | null;
  promptModifiers: string | null;
}

export function PersonaManager({
  brandId,
  initialPersonas,
}: {
  brandId: string;
  initialPersonas: Persona[];
}) {
  const [personas, setPersonas] = useState(initialPersonas);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [income, setIncome] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [painPoints, setPainPoints] = useState<string[]>([""]);
  const [motivations, setMotivations] = useState<string[]>([""]);
  const [aesthetic, setAesthetic] = useState("");
  const [colorTone, setColorTone] = useState("");
  const [photoStyle, setPhotoStyle] = useState("");
  const [lighting, setLighting] = useState("");
  const [compositionNotes, setCompositionNotes] = useState("");
  const [modelType, setModelType] = useState("");
  const [decorStyle, setDecorStyle] = useState("");
  const [promptModifiers, setPromptModifiers] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setAgeRange("");
    setGender("");
    setLocation("");
    setIncome("");
    setLifestyle("");
    setPainPoints([""]);
    setMotivations([""]);
    setAesthetic("");
    setColorTone("");
    setPhotoStyle("");
    setLighting("");
    setCompositionNotes("");
    setModelType("");
    setDecorStyle("");
    setPromptModifiers("");
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const body = {
        brandId,
        name,
        description: description || undefined,
        demographics: {
          ageRange: ageRange || "25-45",
          gender: gender || undefined,
          location: location || undefined,
          income: income || undefined,
          lifestyle: lifestyle || undefined,
        },
        psychographics: {
          painPoints: painPoints.filter(Boolean),
          motivations: motivations.filter(Boolean),
          aesthetic: aesthetic || "moderne",
        },
        visualStyle: {
          colorTone: colorTone || "neutre",
          photographyStyle: photoStyle || "lifestyle",
          lightingPreference: lighting || "naturel",
          compositionNotes: compositionNotes || "",
          modelType: modelType || undefined,
          decorStyle: decorStyle || undefined,
        },
        promptModifiers: promptModifiers || undefined,
      };

      const personaRes = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (personaRes.ok) {
        const data = await personaRes.json();
        setPersonas((prev) => [
          ...prev,
          {
            id: data.id,
            name,
            description: description || null,
            demographics: body.demographics,
            psychographics: body.psychographics,
            visualStyle: body.visualStyle,
            promptModifiers: promptModifiers || null,
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
    await fetch("/api/personas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleEnrich(persona: Persona) {
    setEnrichingId(persona.id);
    try {
      const res = await fetch("/api/personas/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: persona.name,
          description: persona.description,
          ageRange: persona.demographics?.ageRange,
          gender: persona.demographics?.gender,
          location: persona.demographics?.location,
          income: persona.demographics?.income,
          lifestyle: persona.demographics?.lifestyle,
          painPoints: persona.psychographics?.painPoints,
          motivations: persona.psychographics?.motivations,
          aesthetic: persona.psychographics?.aesthetic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedPersona: Persona = {
          ...persona,
          psychographics: {
            painPoints: data.painPoints || persona.psychographics?.painPoints || [],
            motivations: data.motivations || persona.psychographics?.motivations || [],
            aesthetic: persona.psychographics?.aesthetic || "moderne",
          },
          visualStyle: data.visualStyle || persona.visualStyle,
          promptModifiers: data.promptModifiers || persona.promptModifiers,
        };

        // Save to DB
        await fetch("/api/personas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: persona.id,
            psychographics: updatedPersona.psychographics,
            visualStyle: updatedPersona.visualStyle,
            promptModifiers: updatedPersona.promptModifiers,
          }),
        });

        setPersonas((prev) =>
          prev.map((p) => (p.id === persona.id ? updatedPersona : p))
        );
        setExpandedId(persona.id);
      }
    } catch (err) {
      console.error("Enrich error:", err);
    } finally {
      setEnrichingId(null);
    }
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
              onChange={(e) =>
                setter((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`${placeholder} ${i + 1}`}
              className="text-xs h-8"
            />
            {values.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setter((prev) => prev.filter((_, idx) => idx !== i))}
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
          onClick={() => setter((prev) => [...prev, ""])}
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
          <Users className="h-5 w-5" />
          Personas ({personas.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Definissez vos personas avec un maximum de details pour des ads ultra-ciblees
      </p>

      {/* Add persona form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nom du persona *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Marie la sportive, Thomas le geek..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tranche d&apos;age</label>
                <Input
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  placeholder="Ex: 25-35"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description detaillee</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mode de vie, valeurs, aspirations, habitudes de consommation..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Genre</label>
                <Input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Ex: Femme, Homme..."
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Localisation</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Urbain, Paris..."
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Revenu</label>
                <Input
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="Ex: CSP+, 40-60k..."
                  className="text-sm h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Style de vie</label>
              <Input
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                placeholder="Ex: Active, eco-responsable, connectee..."
                className="text-sm"
              />
            </div>

            {/* Psychographics */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold mb-3">Profil psychographique</h4>
              <div className="space-y-3">
                <ArrayFieldEditor
                  label="Points de douleur / Frustrations"
                  placeholder="Frustration"
                  values={painPoints}
                  setter={setPainPoints}
                />
                <ArrayFieldEditor
                  label="Motivations / Desirs"
                  placeholder="Motivation"
                  values={motivations}
                  setter={setMotivations}
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Sensibilite esthetique</label>
                  <Input
                    value={aesthetic}
                    onChange={(e) => setAesthetic(e.target.value)}
                    placeholder="Ex: minimaliste, boheme, luxe, streetwear..."
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Visual style */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold mb-3">Style visuel pour les ads</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Ton de couleur</label>
                  <Input
                    value={colorTone}
                    onChange={(e) => setColorTone(e.target.value)}
                    placeholder="Ex: chaud, froid, vibrant..."
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Style photo</label>
                  <Input
                    value={photoStyle}
                    onChange={(e) => setPhotoStyle(e.target.value)}
                    placeholder="Ex: lifestyle, editorial..."
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Eclairage</label>
                  <Input
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    placeholder="Ex: naturel, studio..."
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Type de modele</label>
                  <Input
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    placeholder="Ex: sportif, elegante..."
                    className="text-xs h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Style de decor</label>
                  <Input
                    value={decorStyle}
                    onChange={(e) => setDecorStyle(e.target.value)}
                    placeholder="Ex: urbain, nature..."
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Notes composition</label>
                  <Input
                    value={compositionNotes}
                    onChange={(e) => setCompositionNotes(e.target.value)}
                    placeholder="Ex: espace pour texte..."
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Prompt modifiers */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Modificateurs de prompt (optionnel)</label>
              <Textarea
                value={promptModifiers}
                onChange={(e) => setPromptModifiers(e.target.value)}
                placeholder="Instructions supplementaires injectees dans chaque prompt pour ce persona..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Creer le persona
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Persona list */}
      {personas.map((persona) => (
        <Card key={persona.id}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === persona.id ? null : persona.id)
                }
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{persona.name}</h3>
                  {persona.demographics?.ageRange && (
                    <Badge variant="outline" className="text-[10px]">
                      {persona.demographics.ageRange}
                    </Badge>
                  )}
                  {expandedId === persona.id ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                {persona.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {persona.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleEnrich(persona)}
                  disabled={enrichingId === persona.id}
                  title="Enrichir avec l'IA"
                >
                  {enrichingId === persona.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Enrichir
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(persona.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-1">
              {persona.visualStyle && (
                <>
                  <Badge variant="outline" className="text-[10px]">
                    {persona.visualStyle.photographyStyle}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {persona.visualStyle.lightingPreference}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {persona.visualStyle.colorTone}
                  </Badge>
                </>
              )}
            </div>

            {/* Expanded view */}
            {expandedId === persona.id && (
              <div className="border-t pt-3 space-y-2 text-xs">
                {persona.demographics && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Demographie</label>
                    <p>
                      {[
                        persona.demographics.ageRange,
                        persona.demographics.gender,
                        persona.demographics.location,
                        persona.demographics.income,
                        persona.demographics.lifestyle,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  </div>
                )}

                {persona.psychographics && (
                  <>
                    {persona.psychographics.painPoints?.length > 0 && (
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">
                          Points de douleur
                        </label>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {persona.psychographics.painPoints.map((p, i) => (
                            <Badge key={i} variant="destructive" className="text-[10px] font-normal">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {persona.psychographics.motivations?.length > 0 && (
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">
                          Motivations
                        </label>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {persona.psychographics.motivations.map((m, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {persona.promptModifiers && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">
                      Modificateurs de prompt
                    </label>
                    <p className="text-muted-foreground italic">{persona.promptModifiers}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
