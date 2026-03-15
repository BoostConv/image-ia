"use client";

import { useState, useCallback } from "react";
import { Trash2, ImageOff, ChevronDown, ChevronRight, X, RefreshCw, Save, Eye } from "lucide-react";

interface LayoutAnalysis {
  grid_structure: string;
  reading_order: string;
  text_zones: string[];
  product_placement: string;
  visual_hierarchy: string;
  negative_space: string;
  color_strategy: string;
  mood: string;
  key_elements: string[];
  composition_summary: string;
  strategic_intent: string;
}

interface LayoutItem {
  id: string;
  layoutFamily: string;
  name: string;
  imagePath: string;
  description: string | null;
  brandId: string | null;
  analysis: LayoutAnalysis | null;
}

interface LayoutGroup {
  id: string;
  label: string;
  description: string;
  items: LayoutItem[];
}

export function LayoutInspirationGrid({ groups }: { groups: LayoutGroup[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(groups.filter((g) => g.items.length > 0).map((g) => g.id))
  );
  const [selectedItem, setSelectedItem] = useState<LayoutItem | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<LayoutAnalysis | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const toggleFamily = (id: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette inspiration ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/layout-inspirations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDeletedIds((prev) => new Set([...prev, id]));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const openAnalysis = (item: LayoutItem) => {
    setSelectedItem(item);
    setEditedAnalysis(item.analysis ? { ...item.analysis } : null);
    setSaveMessage(null);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setEditedAnalysis(null);
    setSaveMessage(null);
  };

  const handleReanalyze = async () => {
    if (!selectedItem) return;
    setIsReanalyzing(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/layout-inspirations/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id }),
      });
      if (!res.ok) throw new Error("Re-analyse echouee");
      const data = await res.json();
      setEditedAnalysis(data.analysis);
      // Update in-place in groups
      selectedItem.analysis = data.analysis;
      setSaveMessage("Analyse regeneree avec succes");
    } catch (err) {
      setSaveMessage(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedItem || !editedAnalysis) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/layout-inspirations/analyze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id, analysis: editedAnalysis }),
      });
      if (!res.ok) throw new Error("Sauvegarde echouee");
      selectedItem.analysis = { ...editedAnalysis };
      setSaveMessage("Analyse sauvegardee");
    } catch (err) {
      setSaveMessage(`Erreur: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof LayoutAnalysis, value: string | string[]) => {
    if (!editedAnalysis) return;
    setEditedAnalysis({ ...editedAnalysis, [field]: value });
  };

  return (
    <>
    {/* Analysis Modal */}
    {selectedItem && (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
        <div className="fixed inset-0 bg-black/60" onClick={closeModal} />
        <div className="relative bg-card rounded-2xl ring-1 ring-foreground/10 shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">{selectedItem.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{selectedItem.layoutFamily}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
                {isReanalyzing ? "Analyse en cours..." : "Re-analyser"}
              </button>
              <button
                onClick={handleSaveAnalysis}
                disabled={isSaving || !editedAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "..." : "Sauvegarder"}
              </button>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className={`mx-6 mt-3 px-3 py-2 rounded-lg text-xs font-medium ${saveMessage.startsWith("Erreur") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
              {saveMessage}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Image */}
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden ring-1 ring-foreground/5 bg-muted">
                  <img
                    src={`/api/layout-inspirations/image/${selectedItem.id}`}
                    alt={selectedItem.name}
                    className="w-full h-auto"
                  />
                </div>
                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}
              </div>

              {/* Right: Analysis fields */}
              <div className="space-y-4">
                {!editedAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Eye className="h-8 w-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">Pas encore d{"'"}analyse</p>
                    <p className="text-xs mt-1">Cliquez sur &quot;Re-analyser&quot; pour generer l{"'"}analyse Vision</p>
                  </div>
                ) : (
                  <>
                    <AnalysisField
                      label="Grille / Structure"
                      value={editedAnalysis.grid_structure}
                      onChange={(v) => updateField("grid_structure", v)}
                    />
                    <AnalysisField
                      label="Parcours de lecture"
                      value={editedAnalysis.reading_order}
                      onChange={(v) => updateField("reading_order", v)}
                    />
                    <AnalysisField
                      label="Placement produit"
                      value={editedAnalysis.product_placement}
                      onChange={(v) => updateField("product_placement", v)}
                    />
                    <AnalysisField
                      label="Hierarchie visuelle"
                      value={editedAnalysis.visual_hierarchy}
                      onChange={(v) => updateField("visual_hierarchy", v)}
                    />
                    <AnalysisField
                      label="Espace negatif"
                      value={editedAnalysis.negative_space}
                      onChange={(v) => updateField("negative_space", v)}
                    />
                    <AnalysisField
                      label="Strategie couleur"
                      value={editedAnalysis.color_strategy}
                      onChange={(v) => updateField("color_strategy", v)}
                    />
                    <AnalysisField
                      label="Ambiance"
                      value={editedAnalysis.mood}
                      onChange={(v) => updateField("mood", v)}
                      small
                    />
                    <AnalysisArrayField
                      label="Zones texte"
                      value={editedAnalysis.text_zones}
                      onChange={(v) => updateField("text_zones", v)}
                    />
                    <AnalysisArrayField
                      label="Elements cles"
                      value={editedAnalysis.key_elements}
                      onChange={(v) => updateField("key_elements", v)}
                    />
                    <AnalysisField
                      label="Intention strategique"
                      value={editedAnalysis.strategic_intent || ""}
                      onChange={(v) => updateField("strategic_intent", v)}
                      large
                    />
                    <AnalysisField
                      label="Resume composition"
                      value={editedAnalysis.composition_summary}
                      onChange={(v) => updateField("composition_summary", v)}
                      large
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="space-y-4">
      {groups.map((group) => {
        const liveItems = group.items.filter((i) => !deletedIds.has(i.id));
        const isExpanded = expandedFamilies.has(group.id);
        const isEmpty = liveItems.length === 0;

        return (
          <div
            key={group.id}
            className={`rounded-xl ring-1 overflow-hidden ${
              isEmpty
                ? "ring-foreground/5 bg-muted/30"
                : "ring-foreground/10 bg-card"
            }`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleFamily(group.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{group.label}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {group.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.description}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  isEmpty
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {liveItems.length} image{liveItems.length !== 1 ? "s" : ""}
              </span>
            </button>

            {/* Image Grid */}
            {isExpanded && (
              <div className="px-4 pb-4">
                {isEmpty ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                    <ImageOff className="h-4 w-4" />
                    <span className="text-sm">Aucune inspiration pour ce layout</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {liveItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-lg overflow-hidden ring-1 ring-foreground/5 bg-background cursor-pointer"
                        onClick={() => openAnalysis(item)}
                      >
                        {/* Image */}
                        <div className="aspect-[4/5] relative bg-muted">
                          <img
                            src={`/api/layout-inspirations/image/${item.id}`}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Analysis badge */}
                          <div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.analysis
                              ? "bg-green-500/80 text-white"
                              : "bg-yellow-500/80 text-white"
                          }`}>
                            {item.analysis ? "Analyse" : "Non analyse"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={item.name}>
                            {item.name}
                          </p>
                          {item.description && (
                            <p
                              className="text-[10px] text-muted-foreground truncate mt-0.5"
                              title={item.description}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          disabled={deletingId === item.id}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
    </>
  );
}

// ─── Helper Components ───────────────────────────────────────

function AnalysisField({
  label,
  value,
  onChange,
  small,
  large,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
  large?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {large ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 ring-1 ring-foreground/5 focus:ring-primary/30 focus:outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-sm bg-muted/50 rounded-lg px-3 py-2 ring-1 ring-foreground/5 focus:ring-primary/30 focus:outline-none ${small ? "max-w-xs" : ""}`}
        />
      )}
    </div>
  );
}

function AnalysisArrayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="space-y-1.5">
        {(value || []).map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 text-sm bg-muted/50 rounded-lg px-3 py-1.5 ring-1 ring-foreground/5 focus:ring-primary/30 focus:outline-none"
            />
            <button
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...(value || []), ""])}
          className="text-xs text-primary hover:underline"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}
