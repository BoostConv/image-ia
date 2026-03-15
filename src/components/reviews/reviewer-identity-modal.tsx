"use client";

import { useState } from "react";
import { User } from "lucide-react";

export interface ReviewerIdentity {
  name: string;
  email: string;
}

interface ReviewerIdentityModalProps {
  onConfirm: (identity: ReviewerIdentity) => void;
  primaryColor?: string;
}

export function ReviewerIdentityModal({ onConfirm, primaryColor = "#6366f1" }: ReviewerIdentityModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-4">
          <div
            className="rounded-full p-3 mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <User className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Identifiez-vous
          </h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Pour que vos collegues voient vos retours
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Nom *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marie Dupont"
              autoFocus
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Email <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="marie@exemple.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            Continuer
          </button>
        </form>
      </div>
    </div>
  );
}
