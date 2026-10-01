"use client";

import { Bell, Search, Sun, Moon, Shield, Sparkles, Command, Check, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const [workspace, setWorkspace] = useState("Acme Corp — Production");

  return (
    <header className="h-16 border-b border-white/[0.07] bg-slate-950/70 backdrop-blur-2xl flex items-center px-6 gap-4 sticky top-0 z-30 justify-between">
      {/* Left: Title / Breadcrumbs */}
      <div className="flex items-center gap-4">
        {title ? (
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-white font-medium">{title}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[200px]">{workspace}</span>
          </div>
        )}

        {/* Live System Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
          <Sparkles size={12} className="text-cyan-400" />
          <span>Claude 3.5 &amp; GPT-4o Security Mesh Online</span>
        </div>
      </div>

      {/* Middle: Command Palette Search */}
      <div className="flex-1 max-w-md hidden md:block mx-4">
        <div className="relative group">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Search code reviews, CVEs, repositories, rules..."
            className="w-full pl-9 pr-14 py-2 rounded-xl bg-slate-900/60 border border-white/[0.07] text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:bg-slate-900 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-slate-400">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Compliance Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Check size={13} />
          <span>SOC-2 Type II</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
        </Link>

        {/* Quick New Scan Button */}
        <Link
          href="/reviews/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-95 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Sparkles size={13} />
          <span>Run Scan</span>
        </Link>

        {/* User Identity */}
        {user ? (
          <Link
            href="/settings"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
          >
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name || ""}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                getInitials(user.name, user.email)
              )}
            </div>
            <span className="hidden xl:block text-xs font-medium text-slate-300 max-w-[100px] truncate">
              {user.name || user.email?.split("@")[0]}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-all"
          >
            <User size={14} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}

