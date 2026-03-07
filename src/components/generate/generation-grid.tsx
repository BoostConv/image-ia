"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Download, Check, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export function GenerationGrid({ images }: { images: GeneratedImage[] }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Aucune image generee
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Configurez votre prompt et cliquez sur Generer
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {images.map((image) => (
        <Card key={image.id} className="group overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={image.url}
              alt="Image generee"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={image.url}
                download
                className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "h-8 w-8")}
              >
                <Download className="h-4 w-4" />
              </a>
              <button className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "h-8 w-8 bg-green-500/90 hover:bg-green-500 text-white")}>
                <Check className="h-4 w-4" />
              </button>
              <button className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "h-8 w-8 bg-red-500/90 hover:bg-red-500 text-white")}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
