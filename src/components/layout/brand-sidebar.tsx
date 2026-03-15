"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Images,
  MessageSquare,
  BookOpen,
  ArrowLeft,
  Palette,
  Package,
  Lightbulb,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { getPublicImageUrl } from "@/lib/images/url";

interface BrandSidebarProps {
  brandId: string;
  brandName: string;
  brandColor?: string;
  logoPath?: string | null;
}

export function BrandSidebar({ brandId, brandName, brandColor, logoPath }: BrandSidebarProps) {
  const pathname = usePathname();
  const basePath = `/brands/${brandId}`;

  const navItems = [
    {
      label: "Generer",
      href: `${basePath}/generate`,
      icon: Sparkles,
    },
    {
      label: "Bibliotheque",
      href: `${basePath}/library`,
      icon: Images,
    },
    {
      label: "Reviews",
      href: `${basePath}/reviews`,
      icon: MessageSquare,
    },
    {
      label: "Guidelines",
      href: `${basePath}/guidelines`,
      icon: BookOpen,
    },
    // Separator will be rendered between index 3 and 4
    {
      label: "Marque",
      href: `${basePath}/brand`,
      icon: Palette,
    },
    {
      label: "Produits",
      href: `${basePath}/products`,
      icon: Package,
    },
    {
      label: "Regles IA",
      href: `${basePath}/rules`,
      icon: ShieldAlert,
    },
    {
      label: "Style Policy",
      href: `${basePath}/style`,
      icon: SlidersHorizontal,
    },
    {
      label: "Inspirations",
      href: `${basePath}/inspirations`,
      icon: Lightbulb,
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Back to admin */}
      <div className="border-b px-3 py-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Toutes les marques
        </Link>
      </div>

      {/* Brand header */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        {logoPath ? (
          <div className="relative h-8 w-8 rounded-lg overflow-hidden border bg-white">
            <Image
              src={getPublicImageUrl(logoPath)}
              alt={brandName}
              fill
              className="object-contain p-0.5"
              sizes="32px"
            />
          </div>
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: brandColor || "#6366f1" }}
          >
            <span className="text-xs font-bold text-white">
              {brandName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold leading-tight truncate">{brandName}</h1>
          <p className="text-[10px] text-muted-foreground">Espace marque</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.href}>
              {/* Separator before "Marque" (index 4) */}
              {index === 4 && (
                <div className="my-2 border-t" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Powered by Nano Banana PRO
        </p>
      </div>
    </aside>
  );
}
