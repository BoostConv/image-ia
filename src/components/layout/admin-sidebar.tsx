"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Palette, Settings, Image, LayoutGrid, MessageSquare } from "lucide-react";

const navItems = [
  {
    label: "Marques",
    href: "/",
    icon: Palette,
  },
  {
    label: "Revisions",
    href: "/revisions",
    icon: MessageSquare,
    hasBadge: true,
  },
  {
    label: "Layouts",
    href: "/layouts",
    icon: LayoutGrid,
  },
  {
    label: "Parametres",
    href: "/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [revisionCount, setRevisionCount] = useState(0);

  useEffect(() => {
    async function fetchRevisionCount() {
      try {
        const res = await fetch("/api/revisions/count");
        if (res.ok) {
          const data = await res.json();
          setRevisionCount(data.count);
        }
      } catch {
        // silently fail
      }
    }
    fetchRevisionCount();
    // Poll every 30s
    const interval = setInterval(fetchRevisionCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Image className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Boost IA Static</h1>
          <p className="text-[10px] text-muted-foreground">Generateur d'ads IA</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || (pathname.startsWith("/brands") && !pathname.includes("/brands/"))
              : pathname === item.href || pathname.startsWith(item.href + "/");
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
              <span className="flex-1">{item.label}</span>
              {item.hasBadge && revisionCount > 0 && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  isActive
                    ? "bg-primary-foreground text-primary"
                    : "bg-amber-500 text-white"
                )}>
                  {revisionCount}
                </span>
              )}
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
