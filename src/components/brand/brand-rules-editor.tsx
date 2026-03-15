"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Plus, X, Pencil, Type, Image, Lightbulb, Globe } from "lucide-react";
import { nanoid } from "nanoid";
import type { BrandRule, BrandRuleCategory, BrandRules } from "@/lib/db/schema";

interface BrandRulesEditorProps {
  brandId: string;
  initialRules: BrandRules | null;
}

const CATEGORY_CONFIG: Record<
  BrandRuleCategory,
  { label: string; color: string; icon: typeof Type; description: string }
> = {
  copy: {
    label: "Copy",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Type,
    description: "Ne jamais dire ou formuler...",
  },
  visual: {
    label: "Visuel",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Image,
    description: "Ne jamais montrer dans l'image...",
  },
  concept: {
    label: "Concept",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Lightbulb,
    description: "Ne jamais proposer comme idée...",
  },
  global: {
    label: "Global",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Globe,
    description: "S'applique partout (copy + visuel + concept)",
  },
};

const PLACEHOLDER_EXAMPLES: Record<BrandRuleCategory, string> = {
  copy: "Ex: Ne jamais dire 'le meilleur produit du marché'",
  visual: "Ex: Pas d'enfants dans les visuels",
  concept: "Ex: Pas de comparaison avec la concurrence",
  global: "Ex: Toujours tutoyer le client",
};

export function BrandRulesEditor({ brandId, initialRules }: BrandRulesEditorProps) {
  const [rules, setRules] = useState<BrandRule[]>(initialRules?.rules || []);
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<BrandRuleCategory>("global");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function saveRules(updatedRules: BrandRule[]) {
    setSaving(true);
    try {
      await fetch(`/api/brands/${brandId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules }),
      });
      setRules(updatedRules);
    } catch (error) {
      console.error("Failed to save rules:", error);
    } finally {
      setSaving(false);
    }
  }

  function addRule() {
    if (!newText.trim()) return;
    const rule: BrandRule = {
      id: nanoid(8),
      text: newText.trim(),
      category: newCategory,
    };
    const updated = [...rules, rule];
    saveRules(updated);
    setNewText("");
  }

  function removeRule(id: string) {
    saveRules(rules.filter((r) => r.id !== id));
  }

  function startEdit(rule: BrandRule) {
    setEditingId(rule.id);
    setEditText(rule.text);
  }

  function saveEdit(id: string) {
    if (!editText.trim()) return;
    const updated = rules.map((r) =>
      r.id === id ? { ...r, text: editText.trim() } : r
    );
    saveRules(updated);
    setEditingId(null);
    setEditText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addRule();
    }
  }

  const groupedRules = {
    global: rules.filter((r) => r.category === "global"),
    copy: rules.filter((r) => r.category === "copy"),
    visual: rules.filter((r) => r.category === "visual"),
    concept: rules.filter((r) => r.category === "concept"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Règles IA
          {rules.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {rules.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Contraintes respectées par l'IA à chaque génération — formulations interdites,
          visuels à éviter, types d'idées à bloquer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new rule */}
        <div className="flex gap-2">
          <Select
            value={newCategory}
            onValueChange={(v) => setNewCategory(v as BrandRuleCategory)}
          >
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_CONFIG) as BrandRuleCategory[]).map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const Icon = config.icon;
                return (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_EXAMPLES[newCategory]}
            className="flex-1 text-sm"
          />
          <Button
            onClick={addRule}
            disabled={!newText.trim() || saving}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {/* Rules list grouped by category */}
        {rules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune règle définie. L'IA génère sans contraintes spécifiques.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Object.keys(groupedRules) as BrandRuleCategory[]).map((cat) => {
              const catRules = groupedRules[cat];
              if (catRules.length === 0) return null;
              const config = CATEGORY_CONFIG[cat];

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {config.description}
                    </span>
                  </div>
                  {catRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      {editingId === rule.id ? (
                        <>
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(rule.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 text-sm h-7"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => saveEdit(rule.id)}
                          >
                            OK
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-muted-foreground">
                            {rule.text}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEdit(rule)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                            onClick={() => removeRule(rule.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
