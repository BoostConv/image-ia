"use client";

import { useEffect, useState } from "react";
import { useGeneration } from "@/contexts/generation-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, X, ImageIcon, AlertCircle } from "lucide-react";

export function GenerationFloatingIndicator() {
  const {
    isGenerating,
    phase,
    phaseMessage,
    progress,
    batchStats,
    error,
    brandId,
    cancelGeneration,
    clearResults,
  } = useGeneration();

  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Show indicator when generating or just completed
  // Auto-hide 5s after completion
  useEffect(() => {
    if (isGenerating) {
      setVisible(true);
      return;
    }

    if (phase === "complete" || error) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        clearResults();
      }, 5000);
      return () => clearTimeout(timer);
    }

    setVisible(false);
  }, [isGenerating, phase, error, clearResults]);

  // Don't render if nothing to show
  if (!visible) return null;

  // Don't render on the generate page itself (it has its own detailed progress)
  const isOnGeneratePage = brandId && pathname?.includes(`/brands/${brandId}/generate`);
  if (isOnGeneratePage) return null;

  const isComplete = phase === "complete";
  const hasError = !!error;
  const generateUrl = brandId ? `/brands/${brandId}/generate` : "#";

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-full border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-2.5 text-sm max-w-sm">
        {/* Status icon */}
        {hasError ? (
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        )}

        {/* Content link — clicking navigates to generate page */}
        <Link
          href={generateUrl}
          className="flex items-center gap-2 min-w-0 hover:underline"
        >
          <span className="truncate max-w-[180px] text-sm">
            {hasError ? "Erreur de generation" : phaseMessage || "Generation en cours..."}
          </span>

          {/* Image counter */}
          {progress.total > 0 && !hasError && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <ImageIcon className="h-3 w-3" />
              {batchStats.completed}/{progress.total}
            </span>
          )}
        </Link>

        {/* Cancel / Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isGenerating) {
              cancelGeneration();
            } else {
              setVisible(false);
              clearResults();
            }
          }}
          className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
          title={isGenerating ? "Annuler" : "Fermer"}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
