"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import type { ReviewVerdict } from "./review-buttons";

interface ReviewModalProps {
  verdict: ReviewVerdict;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
  submitting?: boolean;
}

const modalConfig: Record<ReviewVerdict, { title: string; placeholder: string; required: boolean; color: string }> = {
  approved: {
    title: "Pourquoi validez-vous ?",
    placeholder: "Commentaire optionnel...",
    required: false,
    color: "#22c55e",
  },
  rejected: {
    title: "Pourquoi refusez-vous ?",
    placeholder: "Commentaire optionnel...",
    required: false,
    color: "#ef4444",
  },
  revision: {
    title: "Que faut-il corriger ?",
    placeholder: "Decrivez les modifications souhaitees. Soyez le plus precis possible...",
    required: true,
    color: "#f59e0b",
  },
  variant: {
    title: "Quelle direction pour la variante ?",
    placeholder: "Decrivez la direction souhaitee : autre ambiance, autre angle, autre eclairage...",
    required: true,
    color: "#3b82f6",
  },
};

export function ReviewModal({ verdict, onConfirm, onCancel, submitting = false }: ReviewModalProps) {
  const [comment, setComment] = useState("");
  const config = modalConfig[verdict];
  const canSubmit = !config.required || comment.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{config.title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            autoFocus
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            style={{ "--tw-ring-color": config.color } as React.CSSProperties}
          />
          {config.required && (
            <p className="text-xs text-muted-foreground">* Justification obligatoire</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(comment.trim())}
              disabled={!canSubmit || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: submitting ? "#9ca3af" : config.color }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
