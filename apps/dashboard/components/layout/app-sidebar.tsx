"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlaySquare,
  Activity,
  Layers,
  Terminal,
  Zap,
  Flame,
  FileCode,
  Sparkles,
  Command,
} from "lucide-react";
import { NavUser } from "./nav-user";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "warning";
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        title: "Test Runs & Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    heading: "Test Management",
    items: [
      {
        title: "Test Case Explorer",
        href: "/explorer",
        icon: Layers,
      },
      {
        title: "Trends & Stability",
        href: "/trends",
        icon: Activity,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300">
      {/* Header Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Command className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-tight text-sidebar-foreground">
            QATOOL
          </span>
          <span className="text-[10px] text-muted-foreground">
            Automation Platform v2
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="space-y-1.5">
            <h4 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.heading}
            </h4>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Profile */}
      <div className="border-t border-sidebar-border p-2 bg-sidebar">
        <NavUser />
      </div>
    </aside>
  );
}
