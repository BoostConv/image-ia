"use client";

import { cn } from "@/lib/utils";
import { FORMAT_PRESETS } from "@/lib/ai/prompt-templates";
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  Package,
  Camera,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  Package,
  Camera,
  Sparkles,
};

// Single select mode (legacy)
export function FormatSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FORMAT_PRESETS.map((format) => {
        const Icon = iconMap[format.icon] || Square;
        const isActive = selected === format.id;

        return (
          <button
            key={format.id}
            onClick={() => onSelect(format.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all",
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50 hover:bg-accent"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-medium leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Multi-select mode for batch generation
export function FormatMultiSelector({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FORMAT_PRESETS.map((format) => {
        const Icon = iconMap[format.icon] || Square;
        const isActive = selected.has(format.id);

        return (
          <button
            key={format.id}
            onClick={() => onToggle(format.id)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all",
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50 hover:bg-accent"
            )}
          >
            {isActive && (
              <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />
            )}
            <Icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-medium leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format.label}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {format.aspectRatio}
            </span>
          </button>
        );
      })}
    </div>
  );
}
