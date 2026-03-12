"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { GenerationProvider } from "@/contexts/generation-context";
import { GenerationFloatingIndicator } from "@/components/generation/floating-indicator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <GenerationProvider>
        {children}
        <GenerationFloatingIndicator />
      </GenerationProvider>
    </TooltipProvider>
  );
}
