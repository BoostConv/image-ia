"use client";

import { CheckCircle2, XCircle, Pencil, Copy } from "lucide-react";

export type ReviewVerdict = "approved" | "rejected" | "revision" | "variant";

interface ReviewButtonsProps {
  existingVerdict?: string | null;
  onReview: (verdict: ReviewVerdict) => void;
  compact?: boolean;
  disabled?: boolean;
}

const verdictConfig: Record<
  ReviewVerdict,
  { label: string; icon: typeof CheckCircle2; colors: string; badge: string }
> = {
  approved: {
    label: "Valider",
    icon: CheckCircle2,
    colors: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    badge: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Refuser",
    icon: XCircle,
    colors: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    badge: "bg-red-100 text-red-700",
  },
  revision: {
    label: "Corriger",
    icon: Pencil,
    colors: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    badge: "bg-amber-100 text-amber-700",
  },
  variant: {
    label: "Variant",
    icon: Copy,
    colors: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
};

const verdictLabels: Record<string, string> = {
  approved: "Valide",
  rejected: "Refuse",
  revision: "Correction demandee",
  variant: "Variant demande",
};

export function ReviewButtons({
  existingVerdict,
  onReview,
  compact = false,
  disabled = false,
}: ReviewButtonsProps) {
  const verdicts: ReviewVerdict[] = ["approved", "rejected", "revision", "variant"];

  if (existingVerdict && verdictConfig[existingVerdict as ReviewVerdict]) {
    const config = verdictConfig[existingVerdict as ReviewVerdict];
    const Icon = config.icon;
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.badge}`}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{verdictLabels[existingVerdict]}</span>
        </div>
        <button
          onClick={() => onReview(existingVerdict as ReviewVerdict)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Changer d&apos;avis
        </button>
      </div>
    );
  }

  return (
    <div className={`grid ${compact ? "grid-cols-4 gap-1.5" : "grid-cols-4 gap-2"}`}>
      {verdicts.map((verdict) => {
        const config = verdictConfig[verdict];
        const Icon = config.icon;
        return (
          <button
            key={verdict}
            onClick={() => onReview(verdict)}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 ${
              compact ? "p-2" : "p-3"
            } ${config.colors} transition-colors disabled:opacity-50`}
          >
            <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-medium`}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
