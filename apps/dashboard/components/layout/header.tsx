"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Zap, CheckCircle2, Shield } from "lucide-react";
import { ThemeSwitch } from "./theme-switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  // Derive breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/"
          className="font-medium hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const href = "/" + segments.slice(0, idx + 1).join("/");
          const title =
            seg === "runs"
              ? "Runs"
              : seg === "explorer"
              ? "Explorer"
              : seg === "trends"
              ? "Trends"
              : seg.length > 12
              ? `${seg.slice(0, 8)}...`
              : seg;

          return (
            <span key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              {isLast ? (
                <span className="font-semibold text-foreground capitalize">
                  {title}
                </span>
              ) : (
                <Link
                  href={href}
                  className="font-medium hover:text-foreground transition-colors capitalize"
                >
                  {title}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Badge variant="success" className="gap-1.5 py-1 text-[11px] font-medium hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Engine v2 Active
        </Badge>

        <ThemeSwitch />
      </div>
    </header>
  );
}
