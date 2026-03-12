"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Target } from "lucide-react";
import type { PositionnementStrategique } from "@/lib/db/schema";
import { AiBadge } from "./gap-warnings";

interface PositionnementEditorProps {
  value: PositionnementStrategique;
  onChange: (value: PositionnementStrategique) => void;
  sources?: Record<string, string>;
}

const PRIX_NIVEAUX = [
  { value: "entree", label: "Entree de gamme" },
  { value: "milieu", label: "Milieu de gamme" },
  { value: "moyen_haut", label: "Moyen-haut de gamme" },
  { value: "premium", label: "Premium" },
  { value: "luxe", label: "Luxe" },
] as const;

export function PositionnementEditor({
  value,
  onChange,
  sources,
}: PositionnementEditorProps) {
  const updateField = <K extends keyof PositionnementStrategique>(
    field: K,
    newValue: PositionnementStrategique[K]
  ) => {
    onChange({ ...value, [field]: newValue });
  };

  const updatePrixField = <
    K extends keyof PositionnementStrategique["positionnementPrix"]
  >(
    field: K,
    newValue: PositionnementStrategique["positionnementPrix"][K]
  ) => {
    onChange({
      ...value,
      positionnementPrix: { ...value.positionnementPrix, [field]: newValue },
    });
  };

  const addAvantage = () => {
    updateField("avantagesConcurrentiels", [
      ...value.avantagesConcurrentiels,
      "",
    ]);
  };

  const removeAvantage = (index: number) => {
    updateField(
      "avantagesConcurrentiels",
      value.avantagesConcurrentiels.filter((_, i) => i !== index)
    );
  };

  const updateAvantage = (index: number, newValue: string) => {
    const updated = [...value.avantagesConcurrentiels];
    updated[index] = newValue;
    updateField("avantagesConcurrentiels", updated);
  };

  const addTension = () => {
    updateField("tensionsPositionnement", [...value.tensionsPositionnement, ""]);
  };

  const removeTension = (index: number) => {
    updateField(
      "tensionsPositionnement",
      value.tensionsPositionnement.filter((_, i) => i !== index)
    );
  };

  const updateTension = (index: number, newValue: string) => {
    const updated = [...value.tensionsPositionnement];
    updated[index] = newValue;
    updateField("tensionsPositionnement", updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-blue-500" />
          Positionnement Strategique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proposition de valeur */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="propositionValeur" className="text-sm font-medium">
              Proposition de valeur
            </Label>
            <div className="flex items-center gap-2">
              {sources?.propositionValeur && (
                <span className="text-xs text-muted-foreground">
                  Source: {sources.propositionValeur}
                </span>
              )}
              <AiBadge />
            </div>
          </div>
          <Textarea
            id="propositionValeur"
            value={value.propositionValeur}
            onChange={(e) => updateField("propositionValeur", e.target.value)}
            placeholder="La proposition de valeur unique de la marque en 1-2 phrases"
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Positionnement prix */}
        <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Positionnement prix</Label>
            <AiBadge />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="prixNiveau" className="text-xs text-muted-foreground">
                Niveau
              </Label>
              <Select
                value={value.positionnementPrix.niveau}
                onValueChange={(v) =>
                  updatePrixField(
                    "niveau",
                    v as PositionnementStrategique["positionnementPrix"]["niveau"]
                  )
                }
              >
                <SelectTrigger id="prixNiveau" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIX_NIVEAUX.map((niveau) => (
                    <SelectItem key={niveau.value} value={niveau.value}>
                      {niveau.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prixMoyen" className="text-xs text-muted-foreground">
                Prix moyen (optionnel)
              </Label>
              <Input
                id="prixMoyen"
                type="number"
                value={value.positionnementPrix.prixMoyen ?? ""}
                onChange={(e) =>
                  updatePrixField(
                    "prixMoyen",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="€"
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="prixJustification"
              className="text-xs text-muted-foreground"
            >
              Justification
            </Label>
            <Input
              id="prixJustification"
              value={value.positionnementPrix.justification}
              onChange={(e) =>
                updatePrixField("justification", e.target.value)
              }
              placeholder="Pourquoi ce niveau de prix (qualite, audience, etc.)"
              className="text-sm"
            />
          </div>
        </div>

        {/* Element distinctif */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="elementDistinctif" className="text-sm font-medium">
              Element distinctif
            </Label>
            <AiBadge />
          </div>
          <Textarea
            id="elementDistinctif"
            value={value.elementDistinctif}
            onChange={(e) => updateField("elementDistinctif", e.target.value)}
            placeholder="LE truc qui distingue la marque de tous ses concurrents"
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Avantages concurrentiels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Avantages concurrentiels ({value.avantagesConcurrentiels.length})
            </Label>
            <AiBadge />
          </div>
          <div className="space-y-2">
            {value.avantagesConcurrentiels.map((avantage, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={avantage}
                  onChange={(e) => updateAvantage(index, e.target.value)}
                  placeholder={`Avantage ${index + 1}`}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAvantage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAvantage}
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter un avantage
          </Button>
        </div>

        {/* Tensions de positionnement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Tensions / Risques ({value.tensionsPositionnement.length})
            </Label>
            <AiBadge />
          </div>
          <p className="text-xs text-muted-foreground">
            Contradictions ou risques potentiels dans le positionnement
          </p>
          <div className="space-y-2">
            {value.tensionsPositionnement.map((tension, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={tension}
                  onChange={(e) => updateTension(index, e.target.value)}
                  placeholder={`Tension ${index + 1}`}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTension(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTension}
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter une tension
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
