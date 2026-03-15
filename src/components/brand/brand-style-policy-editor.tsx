"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Eye, Camera, Type, Sparkles } from "lucide-react";

interface StylePermissions {
  [style: string]: "allowed" | "stretch" | "forbidden";
}

interface BrandStylePolicyData {
  style_permissions?: {
    brand_native?: StylePermissions;
    brand_adjacent?: StylePermissions;
    stretch?: StylePermissions;
  };
  preferred_render_families?: string[];
  human_presence_allowed?: string[];
  max_stretch_per_batch?: number;
  color_constraints?: {
    require_brand_primary?: boolean;
    forbidden_backgrounds?: string[];
    allow_neon?: boolean;
  };
  product_constraints?: {
    require_product_visible?: boolean;
    min_product_scale?: number;
    allow_occlusion?: boolean;
    require_exact_packaging?: boolean;
  };
  copy_constraints?: {
    max_headline_chars?: number;
    forbidden_cta_words?: string[];
    tone_rules?: string[];
  };
}

interface Props {
  brandId: string;
  initialPolicy: BrandStylePolicyData | null;
}

const VISUAL_STYLES = [
  { key: "quiet_luxury", label: "Quiet Luxury", description: "Minimaliste, raffiné, tons neutres" },
  { key: "hyper_clean_tech", label: "Hyper Clean Tech", description: "Ultra moderne, gradients, géométrique" },
  { key: "editorial_fashion", label: "Editorial Fashion", description: "Magazine, cinématographique" },
  { key: "organic_earthy", label: "Organic Earthy", description: "Naturel, textures, tons chauds" },
  { key: "vibrant_street", label: "Vibrant Street", description: "Urbain, saturé, dynamique" },
  { key: "gritty_industrial", label: "Gritty Industrial", description: "Brut, texturé, contrasté" },
  { key: "dreamcore", label: "Dreamcore", description: "Onirique, surréaliste, doux" },
  { key: "pop_high_saturation", label: "Pop High Saturation", description: "Vif, pop art, maximaliste" },
];

const RENDER_FAMILIES = [
  { key: "photo_led", label: "Photo Led" },
  { key: "design_led", label: "Design Led" },
  { key: "hybrid", label: "Hybrid" },
];

const HUMAN_PRESENCES = [
  { key: "none", label: "Aucune" },
  { key: "hand", label: "Mains" },
  { key: "face", label: "Visage" },
  { key: "body", label: "Corps entier" },
];

const PERMISSION_COLORS: Record<string, string> = {
  allowed: "bg-green-100 text-green-800 border-green-300",
  stretch: "bg-amber-100 text-amber-800 border-amber-300",
  forbidden: "bg-red-100 text-red-800 border-red-300",
};

export default function BrandStylePolicyEditor({ brandId, initialPolicy }: Props) {
  const [policy, setPolicy] = useState<BrandStylePolicyData>(initialPolicy || {});
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (updated: BrandStylePolicyData) => {
    setSaving(true);
    try {
      await fetch(`/api/brands/${brandId}/style-policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to save style policy:", err);
    } finally {
      setSaving(false);
    }
  }, [brandId]);

  const updateAndSave = useCallback((updater: (prev: BrandStylePolicyData) => BrandStylePolicyData) => {
    setPolicy(prev => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, [save]);

  const getPermission = (style: string): "allowed" | "stretch" | "forbidden" => {
    return policy.style_permissions?.brand_native?.[style] || "allowed";
  };

  const cyclePermission = (style: string) => {
    const current = getPermission(style);
    const next = current === "allowed" ? "stretch" : current === "stretch" ? "forbidden" : "allowed";
    updateAndSave(prev => ({
      ...prev,
      style_permissions: {
        ...prev.style_permissions,
        brand_native: {
          ...prev.style_permissions?.brand_native,
          [style]: next,
        },
      },
    }));
  };

  const toggleHumanPresence = (key: string) => {
    updateAndSave(prev => {
      const current = prev.human_presence_allowed || ["none", "hand", "face", "body"];
      const next = current.includes(key)
        ? current.filter(k => k !== key)
        : [...current, key];
      return { ...prev, human_presence_allowed: next.length > 0 ? next : ["none"] };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Style Policy
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configurer les contraintes visuelles pour cette marque. Les champs non modifies utilisent les valeurs inferees du ton visuel.
          </p>
        </div>
        {saving && <Badge variant="outline" className="animate-pulse">Enregistrement...</Badge>}
      </div>

      {/* Visual Styles Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Styles visuels autorises (cliquer pour changer)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VISUAL_STYLES.map(style => {
              const permission = getPermission(style.key);
              return (
                <button
                  key={style.key}
                  onClick={() => cyclePermission(style.key)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors text-left ${
                    permission === "allowed" ? "border-green-300 bg-green-50" :
                    permission === "stretch" ? "border-amber-300 bg-amber-50" :
                    "border-red-300 bg-red-50"
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </div>
                  <Badge className={PERMISSION_COLORS[permission]}>
                    {permission === "allowed" ? "OK" : permission === "stretch" ? "Stretch" : "Interdit"}
                  </Badge>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            OK = toujours autorise | Stretch = possible mais limite | Interdit = jamais utilise
          </p>
        </CardContent>
      </Card>

      {/* Render Families */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Familles de rendu (ordre de preference)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={(policy.preferred_render_families || ["photo_led", "hybrid", "design_led"])[0]}
            onValueChange={(val: string | null) => {
              if (!val) return;
              const others = RENDER_FAMILIES.map(r => r.key).filter(k => k !== val);
              updateAndSave(prev => ({ ...prev, preferred_render_families: [val, ...others] }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rendu prefere" />
            </SelectTrigger>
            <SelectContent>
              {RENDER_FAMILIES.map(rf => (
                <SelectItem key={rf.key} value={rf.key}>{rf.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Le rendu prefere sera utilise en priorite. Les autres suivront.
          </p>
        </CardContent>
      </Card>

      {/* Human Presence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Presence humaine autorisee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {HUMAN_PRESENCES.map(hp => {
              const active = (policy.human_presence_allowed || ["none", "hand", "face", "body"]).includes(hp.key);
              return (
                <button
                  key={hp.key}
                  onClick={() => toggleHumanPresence(hp.key)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    active ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {hp.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Constraints */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Contraintes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Max stretch */}
          <div className="space-y-2">
            <Label className="text-sm">Max concepts "stretch" par batch</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[policy.max_stretch_per_batch ?? 2]}
                min={0}
                max={5}
                step={1}
                onValueChange={(val: number | readonly number[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  updateAndSave(prev => ({ ...prev, max_stretch_per_batch: v }));
                }}
                className="flex-1"
              />
              <span className="text-sm font-mono w-6 text-center">{policy.max_stretch_per_batch ?? 2}</span>
            </div>
          </div>

          {/* Neon */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Autoriser les couleurs neon</Label>
            <Switch
              checked={policy.color_constraints?.allow_neon ?? true}
              onCheckedChange={(checked) => {
                updateAndSave(prev => ({
                  ...prev,
                  color_constraints: { ...prev.color_constraints, allow_neon: checked },
                }));
              }}
            />
          </div>

          {/* Brand primary required */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Couleur primaire marque obligatoire</Label>
            <Switch
              checked={policy.color_constraints?.require_brand_primary ?? false}
              onCheckedChange={(checked) => {
                updateAndSave(prev => ({
                  ...prev,
                  color_constraints: { ...prev.color_constraints, require_brand_primary: checked },
                }));
              }}
            />
          </div>

          {/* Product visible */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Produit toujours visible</Label>
            <Switch
              checked={policy.product_constraints?.require_product_visible ?? true}
              onCheckedChange={(checked) => {
                updateAndSave(prev => ({
                  ...prev,
                  product_constraints: { ...prev.product_constraints, require_product_visible: checked },
                }));
              }}
            />
          </div>

          {/* Exact packaging */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Packaging exact requis</Label>
            <Switch
              checked={policy.product_constraints?.require_exact_packaging ?? false}
              onCheckedChange={(checked) => {
                updateAndSave(prev => ({
                  ...prev,
                  product_constraints: { ...prev.product_constraints, require_exact_packaging: checked },
                }));
              }}
            />
          </div>

          {/* Max headline chars */}
          <div className="space-y-2">
            <Label className="text-sm">Longueur max headline (caracteres)</Label>
            <Input
              type="number"
              min={15}
              max={80}
              value={policy.copy_constraints?.max_headline_chars ?? 40}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 40;
                updateAndSave(prev => ({
                  ...prev,
                  copy_constraints: { ...prev.copy_constraints, max_headline_chars: val },
                }));
              }}
              className="w-24"
            />
          </div>

          {/* Min product scale */}
          <div className="space-y-2">
            <Label className="text-sm">Taille min produit dans l&apos;image</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[policy.product_constraints?.min_product_scale ?? 0.15]}
                min={0}
                max={0.5}
                step={0.05}
                onValueChange={(val: number | readonly number[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  updateAndSave(prev => ({
                    ...prev,
                    product_constraints: { ...prev.product_constraints, min_product_scale: v },
                  }));
                }}
                className="flex-1"
              />
              <span className="text-sm font-mono w-10 text-center">{((policy.product_constraints?.min_product_scale ?? 0.15) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
