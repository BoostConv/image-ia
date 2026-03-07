"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Images,
  MessageSquare,
  BookOpen,
  Settings,
  ArrowLeft,
  Zap,
} from "lucide-react";

interface BrandSidebarProps {
  brandId: string;
  brandName: string;
  brandColor?: string;
}

export function BrandSidebar({ brandId, brandName, brandColor }: BrandSidebarProps) {
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
    {
      label: "Parametres",
      href: `${basePath}/settings`,
      icon: Settings,
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
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: brandColor || "#6366f1" }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold leading-tight truncate">{brandName}</h1>
          <p className="text-[10px] text-muted-foreground">Espace marque</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
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
