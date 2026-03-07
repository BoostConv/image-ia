"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Palette,
  Images,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";

const navItems = [
  {
    label: "Generer",
    href: "/generate",
    icon: Sparkles,
  },
  {
    label: "Marques",
    href: "/brands",
    icon: Palette,
  },
  {
    label: "Bibliotheque",
    href: "/library",
    icon: Images,
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: MessageSquare,
  },
  {
    label: "Parametres",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Visual Intelligence</h1>
          <p className="text-[10px] text-muted-foreground">Boost Conversion</p>
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

      {/* Footer */}
      <div className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Powered by Nano Banana PRO
        </p>
      </div>
    </aside>
  );
}
