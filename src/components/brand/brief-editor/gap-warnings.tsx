"use client";

import { AlertTriangle, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefMetadata } from "@/lib/db/schema";

interface GapWarningsProps {
  gaps: BriefMetadata["gaps"];
  onFieldClick?: (field: string) => void;
}

export function GapWarnings({ gaps, onFieldClick }: GapWarningsProps) {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  const warningGaps = gaps.filter((g) => g.severity === "warning");

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          {gaps.length} element{gaps.length > 1 ? "s" : ""} a completer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {criticalGaps.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              Critique ({criticalGaps.length})
            </p>
            {criticalGaps.map((gap, i) => (
              <GapItem
                key={`critical-${i}`}
                gap={gap}
                isCritical
                onClick={() => onFieldClick?.(gap.field)}
              />
            ))}
          </div>
        )}
        {warningGaps.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              A ameliorer ({warningGaps.length})
            </p>
            {warningGaps.map((gap, i) => (
              <GapItem
                key={`warning-${i}`}
                gap={gap}
                onClick={() => onFieldClick?.(gap.field)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GapItemProps {
  gap: { field: string; reason: string; severity: "warning" | "critical" };
  isCritical?: boolean;
  onClick?: () => void;
}

function GapItem({ gap, isCritical, onClick }: GapItemProps) {
  const fieldLabel = formatFieldName(gap.field);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
        isCritical
          ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
      }`}
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{fieldLabel}</span>
        <span className="mx-1">—</span>
        <span className="text-muted-foreground">{gap.reason}</span>
      </div>
      <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
    </button>
  );
}

function formatFieldName(field: string): string {
  const labels: Record<string, string> = {
    vision: "Vision",
    mission: "Mission",
    combatEnnemi: "Combat/Ennemi",
    histoireMarque: "Histoire de la marque",
    valeurs: "Valeurs",
    propositionValeur: "Proposition de valeur",
    positionnementPrix: "Positionnement prix",
    elementDistinctif: "Element distinctif",
    avantagesConcurrentiels: "Avantages concurrentiels",
    tensionsPositionnement: "Tensions",
    tonDominant: "Ton dominant",
    registresEncourages: "Registres encourages",
    registresAEviter: "Registres a eviter",
    vocabulaireRecurrent: "Vocabulaire",
    redLines: "Red lines",
  };
  return labels[field] || field;
}

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className = "" }: ConfidenceBadgeProps) {
  const getColor = () => {
    if (confidence >= 0.7) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    if (confidence >= 0.4) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getColor()} ${className}`}
    >
      {Math.round(confidence * 100)}% confiance
    </span>
  );
}

interface AiBadgeProps {
  className?: string;
}

export function AiBadge({ className = "" }: AiBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-200 ${className}`}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      AI
    </span>
  );
}
