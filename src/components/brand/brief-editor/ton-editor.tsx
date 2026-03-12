"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, MessageCircle, AlertOctagon } from "lucide-react";
import type { TonCommunication } from "@/lib/db/schema";
import { AiBadge } from "./gap-warnings";

interface TonEditorProps {
  value: TonCommunication;
  onChange: (value: TonCommunication) => void;
  sources?: Record<string, string>;
}

export function TonEditor({ value, onChange, sources }: TonEditorProps) {
  const updateField = <K extends keyof TonCommunication>(
    field: K,
    newValue: TonCommunication[K]
  ) => {
    onChange({ ...value, [field]: newValue });
  };

  const createArrayHandlers = (field: keyof TonCommunication) => ({
    add: () => {
      const current = value[field] as string[];
      updateField(field, [...current, ""] as TonCommunication[typeof field]);
    },
    remove: (index: number) => {
      const current = value[field] as string[];
      updateField(
        field,
        current.filter((_, i) => i !== index) as TonCommunication[typeof field]
      );
    },
    update: (index: number, newValue: string) => {
      const current = [...(value[field] as string[])];
      current[index] = newValue;
      updateField(field, current as TonCommunication[typeof field]);
    },
  });

  const tonHandlers = createArrayHandlers("tonDominant");
  const registresEncouragesHandlers = createArrayHandlers("registresEncourages");
  const registresAEviterHandlers = createArrayHandlers("registresAEviter");
  const vocabulaireHandlers = createArrayHandlers("vocabulaireRecurrent");
  const redLinesHandlers = createArrayHandlers("redLines");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-green-500" />
          Ton & Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ton dominant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Ton dominant ({value.tonDominant.length} adjectifs)
            </Label>
            <div className="flex items-center gap-2">
              {sources?.tonDominant && (
                <span className="text-xs text-muted-foreground">
                  Source: {sources.tonDominant}
                </span>
              )}
              <AiBadge />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            2-3 adjectifs qui definissent le ton de communication
          </p>
          <div className="flex flex-wrap gap-2">
            {value.tonDominant.map((ton, index) => (
              <div key={index} className="flex items-center gap-1">
                <Input
                  value={ton}
                  onChange={(e) => tonHandlers.update(index, e.target.value)}
                  placeholder="Adjectif"
                  className="w-32 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => tonHandlers.remove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {value.tonDominant.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={tonHandlers.add}
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        {/* Registres encourages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Registres encourages</Label>
            <AiBadge />
          </div>
          <div className="space-y-2">
            {value.registresEncourages.map((registre, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={registre}
                  onChange={(e) =>
                    registresEncouragesHandlers.update(index, e.target.value)
                  }
                  placeholder="Ex: humour leger, pedagogie bienveillante..."
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => registresEncouragesHandlers.remove(index)}
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
            onClick={registresEncouragesHandlers.add}
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter un registre
          </Button>
        </div>

        {/* Registres a eviter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Registres a eviter</Label>
            <AiBadge />
          </div>
          <div className="space-y-2">
            {value.registresAEviter.map((registre, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={registre}
                  onChange={(e) =>
                    registresAEviterHandlers.update(index, e.target.value)
                  }
                  placeholder="Ex: ton corporate, jargon technique..."
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => registresAEviterHandlers.remove(index)}
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
            onClick={registresAEviterHandlers.add}
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter un registre
          </Button>
        </div>

        {/* Vocabulaire recurrent */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Vocabulaire recurrent ({value.vocabulaireRecurrent.length} mots)
            </Label>
            <AiBadge />
          </div>
          <p className="text-xs text-muted-foreground">
            Mots-cles et expressions propres a la marque
          </p>
          <div className="flex flex-wrap gap-2">
            {value.vocabulaireRecurrent.map((mot, index) => (
              <div key={index} className="flex items-center gap-1">
                <Input
                  value={mot}
                  onChange={(e) =>
                    vocabulaireHandlers.update(index, e.target.value)
                  }
                  placeholder="Mot"
                  className="w-28 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => vocabulaireHandlers.remove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={vocabulaireHandlers.add}
            >
              <Plus className="mr-1 h-3 w-3" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Red Lines */}
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200">
              <AlertOctagon className="h-4 w-4" />
              Red Lines ({value.redLines.length})
            </Label>
            <AiBadge />
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">
            Ce que la marque ne doit JAMAIS dire ou montrer dans ses publicites
          </p>
          <div className="space-y-2">
            {value.redLines.map((line, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={line}
                  onChange={(e) =>
                    redLinesHandlers.update(index, e.target.value)
                  }
                  placeholder="Ex: ne jamais mentionner les concurrents par leur nom..."
                  className="text-sm border-red-200 dark:border-red-800"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => redLinesHandlers.remove(index)}
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
            onClick={redLinesHandlers.add}
            className="border-red-200 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30"
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter une red line
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
