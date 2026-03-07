"use client";

import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  green: "border-l-green-500",
  orange: "border-l-orange-500",
  pink: "border-l-pink-500",
};

const dotClasses: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

export function PromptLayerEditor({
  label,
  layerKey,
  value,
  enabled,
  onChange,
  onToggle,
  color,
}: {
  label: string;
  layerKey: string;
  value: string;
  enabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  color: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 p-3 transition-opacity",
        colorClasses[color] || "border-l-gray-500",
        !enabled && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              dotClasses[color] || "bg-gray-500"
            )}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`Activer la couche ${label}`}
        />
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Instructions pour la couche ${label.toLowerCase()}...`}
        className="min-h-[60px] resize-none text-sm"
        disabled={!enabled}
      />
    </div>
  );
}
