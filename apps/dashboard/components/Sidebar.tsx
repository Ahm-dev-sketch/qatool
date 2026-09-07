"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PlaySquare, 
  Activity, 
  Layers, 
  LogOut, 
  Cpu
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Test Runs", href: "/", icon: PlaySquare },
  { name: "Trends & Analytics", href: "/trends", icon: Activity },
  { name: "Test Explorer", href: "/explorer", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/login") return null;

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-[#1e293b] flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-[#1e293b] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide">QATOOL</h1>
          <p className="text-[11px] text-slate-400 font-medium">Custom Test Engine</p>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Monitoring
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#151e32]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1e293b] bg-[#0a0f1d]/60">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
              {session?.user?.name ? session.user.name.charAt(0) : "Q"}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{session?.user?.name || "QA User"}</p>
              <p className="text-[10px] text-slate-400 truncate">{session?.user?.email || "qa@local"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
