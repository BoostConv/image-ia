"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  Palette as PaletteIcon,
  Type,
  Monitor,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";

interface Guideline {
  id: string;
  brandId: string;
  category: string;
  title: string;
  content: string;
  examples: string[] | null;
  priority: number | null;
  isActive: boolean | null;
  source: string | null;
  performanceScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Knowledge {
  id: string;
  category: string;
  insight: string;
  confidence: number | null;
  basedOnApproved: number | null;
  basedOnRejected: number | null;
}

const CATEGORIES = [
  { id: "composition", label: "Composition & Cadrage", icon: Target },
  { id: "color", label: "Couleurs & Palette", icon: PaletteIcon },
  { id: "copy", label: "Texte & Accroche", icon: Type },
  { id: "platform", label: "Regles Plateforme", icon: Monitor },
  { id: "performance", label: "Performance Pub", icon: TrendingUp },
  { id: "brand_rules", label: "Regles de Marque", icon: Shield },
  { id: "ad_psychology", label: "Psychologie Pub", icon: Brain },
];

const STARTER_GUIDELINES = [
  {
    category: "composition",
    title: "Regle des tiers",
    content: "Placer le sujet principal sur les points d'intersection de la regle des tiers pour un cadrage professionnel et equilibre.",
  },
  {
    category: "composition",
    title: "Hierarchie visuelle",
    content: "Le produit ou le message principal doit occuper au moins 40% de l'image. L'oeil doit etre guide naturellement vers l'element cle.",
  },
  {
    category: "composition",
    title: "Espace negatif",
    content: "Laisser suffisamment d'espace vide autour du sujet pour que l'image respire et que le message soit lisible.",
  },
  {
    category: "color",
    title: "Contraste fort",
    content: "Utiliser des contrastes de couleur forts entre le sujet et le fond pour que le produit se detache immediatement.",
  },
  {
    category: "color",
    title: "Coherence palette marque",
    content: "Chaque visuel doit integrer au moins une couleur de la palette de marque pour assurer la reconnaissance visuelle.",
  },
  {
    category: "ad_psychology",
    title: "Emotion avant logique",
    content: "Les meilleures publicites statiques declenchent une emotion AVANT de transmettre un message rationnel. Privilegier des scenes evocatrices, des expressions faciales marquantes, ou des ambiances immersives.",
  },
  {
    category: "ad_psychology",
    title: "Niveaux de conscience",
    content: "Adapter le visuel au niveau de conscience du prospect : Inconscient (pattern interrupt), Conscient du probleme (empathie), Conscient de la solution (demonstration), Conscient du produit (preuve sociale), Tres conscient (offre directe).",
  },
  {
    category: "ad_psychology",
    title: "Effet d'arret du scroll",
    content: "Le visuel doit stopper le scroll en 0.5 seconde. Utiliser des elements visuels inattendus, des contrastes forts, des angles inhabituels ou des situations surprenantes.",
  },
  {
    category: "performance",
    title: "Zone safe pour texte",
    content: "Prevoir une zone de 20% en haut ou en bas de l'image pour l'ajout de texte publicitaire sans masquer le sujet principal.",
  },
  {
    category: "performance",
    title: "Simplicite du message",
    content: "Un seul message par visuel. Une seule promesse. Un seul call-to-action. La clarte bat toujours la complexite.",
  },
  {
    category: "platform",
    title: "Mobile-first",
    content: "85% du trafic est mobile. Les details doivent etre visibles sur un ecran de telephone. Pas de texte trop petit, pas de compositions trop chargees.",
  },
];

export function GuidelinesClient({
  brandId,
  guidelines: initialGuidelines,
  knowledge,
}: {
  brandId: string;
  guidelines: Guideline[];
  knowledge: Knowledge[];
}) {
  const [guidelines, setGuidelines] = useState<Guideline[]>(initialGuidelines);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newGuideline, setNewGuideline] = useState({
    category: "composition",
    title: "",
    content: "",
    priority: 0,
  });

  async function handleAdd() {
    if (!newGuideline.title.trim() || !newGuideline.content.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...newGuideline }),
      });
      const data = await res.json();
      if (res.ok) {
        setGuidelines((prev) => [data, ...prev]);
        setNewGuideline({ category: "composition", title: "", content: "", priority: 0 });
        setIsAdding(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch("/api/guidelines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    setGuidelines((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: !isActive } : g))
    );
  }

  async function handleDelete(id: string) {
    await fetch("/api/guidelines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setGuidelines((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleLoadStarters() {
    setIsLoading(true);
    try {
      for (const starter of STARTER_GUIDELINES) {
        const res = await fetch("/api/guidelines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId, ...starter, priority: 5 }),
        });
        if (res.ok) {
          const data = await res.json();
          setGuidelines((prev) => [...prev, data]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  const activeCount = guidelines.filter((g) => g.isActive).length;
  const grouped: Record<string, Guideline[]> = {};
  for (const g of guidelines) {
    if (!grouped[g.category]) grouped[g.category] = [];
    grouped[g.category].push(g);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm">
          {guidelines.length} guidelines
        </Badge>
        <Badge variant="default" className="text-sm">
          {activeCount} actives
        </Badge>
        {knowledge.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            <Brain className="mr-1 h-3 w-3" />
            {knowledge.length} insights appris
          </Badge>
        )}
      </div>

      {/* Empty state with starter pack */}
      {guidelines.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucune guideline definie
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4 text-center max-w-md">
            Les guidelines sont des regles publicitaires injectees dans chaque
            prompt pour maximiser la qualite des visuels generes.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleLoadStarters} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Charger le pack expert
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter manuellement
            </Button>
          </div>
        </Card>
      )}

      {/* Add form */}
      {(isAdding || guidelines.length > 0) && (
        <div className="flex gap-3">
          {guidelines.length > 0 && !isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une guideline
            </Button>
          )}
          {guidelines.length > 0 && guidelines.length < 5 && (
            <Button variant="outline" onClick={handleLoadStarters} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Pack expert
            </Button>
          )}
        </div>
      )}

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouvelle guideline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Categorie</label>
                <Select
                  value={newGuideline.category}
                  onValueChange={(v) =>
                    v && setNewGuideline((p) => ({ ...p, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={newGuideline.title}
                  onChange={(e) =>
                    setNewGuideline((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Ex: Regle des tiers"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Instruction</label>
              <Textarea
                value={newGuideline.content}
                onChange={(e) =>
                  setNewGuideline((p) => ({ ...p, content: e.target.value }))
                }
                placeholder="Decrivez la regle a suivre pour chaque generation..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Ajouter
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines by category */}
      {Object.entries(grouped).map(([category, items]) => {
        const cat = CATEGORIES.find((c) => c.id === category);
        const Icon = cat?.icon || BookOpen;
        return (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {cat?.label || category}
              <Badge variant="outline" className="text-[10px]">
                {items.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {items.map((g) => (
                <Card
                  key={g.id}
                  className={g.isActive ? "" : "opacity-50"}
                >
                  <CardContent className="flex items-start gap-3 py-3">
                    <Switch
                      checked={g.isActive ?? true}
                      onCheckedChange={() => handleToggle(g.id, g.isActive ?? true)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.content}
                      </p>
                      {g.source === "learned" && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          <Brain className="mr-1 h-2 w-2" />
                          Appris
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(g.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Knowledge insights */}
      {knowledge.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights appris automatiquement
          </h3>
          <div className="grid gap-2">
            {knowledge.map((k) => (
              <Card key={k.id}>
                <CardContent className="py-3">
                  <p className="text-sm">{k.insight}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      Confiance: {Math.round((k.confidence ?? 0.5) * 100)}%
                    </Badge>
                    {(k.basedOnApproved ?? 0) > 0 && (
                      <span className="text-[10px] text-green-600">
                        +{k.basedOnApproved} valides
                      </span>
                    )}
                    {(k.basedOnRejected ?? 0) > 0 && (
                      <span className="text-[10px] text-red-500">
                        -{k.basedOnRejected} refuses
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
