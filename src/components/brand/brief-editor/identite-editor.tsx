"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Sparkles } from "lucide-react";
import type { IdentiteFondamentale } from "@/lib/db/schema";
import { AiBadge } from "./gap-warnings";

interface IdentiteEditorProps {
  value: IdentiteFondamentale;
  onChange: (value: IdentiteFondamentale) => void;
  sources?: Record<string, string>;
}

export function IdentiteEditor({ value, onChange, sources }: IdentiteEditorProps) {
  const updateField = <K extends keyof IdentiteFondamentale>(
    field: K,
    newValue: IdentiteFondamentale[K]
  ) => {
    onChange({ ...value, [field]: newValue });
  };

  const addValeur = () => {
    updateField("valeurs", [
      ...value.valeurs,
      { name: "", signification: "", preuve: "" },
    ]);
  };

  const removeValeur = (index: number) => {
    updateField(
      "valeurs",
      value.valeurs.filter((_, i) => i !== index)
    );
  };

  const updateValeur = (
    index: number,
    field: keyof IdentiteFondamentale["valeurs"][0],
    newValue: string
  ) => {
    const newValeurs = [...value.valeurs];
    newValeurs[index] = { ...newValeurs[index], [field]: newValue };
    updateField("valeurs", newValeurs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Identite Fondamentale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vision */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="vision" className="text-sm font-medium">
              Vision
            </Label>
            <div className="flex items-center gap-2">
              {sources?.vision && (
                <span className="text-xs text-muted-foreground">
                  Source: {sources.vision}
                </span>
              )}
              <AiBadge />
            </div>
          </div>
          <Textarea
            id="vision"
            value={value.vision}
            onChange={(e) => updateField("vision", e.target.value)}
            placeholder="Ou la marque veut emmener son marche/audience (futur desire)"
            rows={2}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            La vision represente le futur que la marque veut creer pour son audience.
          </p>
        </div>

        {/* Mission */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mission" className="text-sm font-medium">
              Mission
            </Label>
            <div className="flex items-center gap-2">
              {sources?.mission && (
                <span className="text-xs text-muted-foreground">
                  Source: {sources.mission}
                </span>
              )}
              <AiBadge />
            </div>
          </div>
          <Textarea
            id="mission"
            value={value.mission}
            onChange={(e) => updateField("mission", e.target.value)}
            placeholder="Pourquoi la marque existe, quel probleme elle resout"
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Combat/Ennemi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="combatEnnemi" className="text-sm font-medium">
              Combat / Ennemi
            </Label>
            <AiBadge />
          </div>
          <Textarea
            id="combatEnnemi"
            value={value.combatEnnemi}
            onChange={(e) => updateField("combatEnnemi", e.target.value)}
            placeholder="Ce contre quoi la marque lutte (ex: industrie polluante, produits chimiques...)"
            rows={2}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            L&apos;ennemi donne un sens profond a la marque et cree de l&apos;engagement.
          </p>
        </div>

        {/* Histoire */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="histoireMarque" className="text-sm font-medium">
              Histoire de la marque
            </Label>
            <AiBadge />
          </div>
          <Textarea
            id="histoireMarque"
            value={value.histoireMarque}
            onChange={(e) => updateField("histoireMarque", e.target.value)}
            placeholder="Genese, fondateurs, moments cles..."
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Valeurs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Valeurs ({value.valeurs.length})
            </Label>
            <AiBadge />
          </div>

          <div className="space-y-3">
            {value.valeurs.map((valeur, index) => (
              <div
                key={index}
                className="relative rounded-lg border bg-muted/30 p-3 space-y-2"
              >
                <button
                  type="button"
                  onClick={() => removeValeur(index)}
                  className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <Input
                  value={valeur.name}
                  onChange={(e) => updateValeur(index, "name", e.target.value)}
                  placeholder="Nom de la valeur (ex: Transparence)"
                  className="text-sm"
                />
                <Input
                  value={valeur.signification}
                  onChange={(e) =>
                    updateValeur(index, "signification", e.target.value)
                  }
                  placeholder="Signification concrete pour la marque"
                  className="text-sm"
                />
                <Input
                  value={valeur.preuve}
                  onChange={(e) => updateValeur(index, "preuve", e.target.value)}
                  placeholder="Preuve verifiable (brevet, certification, chiffre...)"
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addValeur}
            className="w-full"
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter une valeur
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
