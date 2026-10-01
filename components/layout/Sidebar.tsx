"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  GitBranch,
  Users,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  CreditCard,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const navigation = [
  {
    label: "Core Platform",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Executive Dashboard", badge: null },
      { href: "/reviews", icon: Code2, label: "Code Audits", badge: "AI Active" },
      { href: "/repositories", icon: GitBranch, label: "Connected Repos", badge: null },
    ],
  },
  {
    label: "Governance & Team",
    items: [
      { href: "/teams", icon: Users, label: "Engineering Teams", badge: null },
      { href: "/reports", icon: FileText, label: "Compliance Reports", badge: "SOC-2" },
    ],
  },
  {
    label: "Observability",
    items: [
      { href: "/analytics", icon: BarChart3, label: "Risk Analytics", badge: null },
      { href: "/notifications", icon: Bell, label: "Security Alerts", badge: "Live" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    toast.success("Signed out successfully");
    window.location.href = "/login";
  }

  const plan = user?.subscription?.plan || "PRO";
  const planColors: Record<string, string> = {
    FREE: "text-slate-400 bg-slate-800/80 border-slate-700",
    PRO: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    ENTERPRISE: "text-purple-300 bg-purple-500/15 border-purple-500/30",
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] flex flex-col border-r border-white/[0.07] bg-slate-950/90 backdrop-blur-2xl z-40">
      {/* Brand & Organization */}
      <div className="p-4 border-b border-white/[0.07]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">CodeGuard AI</span>
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                  planColors[plan]
                )}
              >
                {plan}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 size={11} className="text-slate-500" />
              <span>Enterprise Mesh v2.4</span>
            </p>
          </div>
        </Link>
      </div>

      {/* New Audit Trigger CTA */}
      <div className="p-3">
        <Link
          href="/reviews/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Sparkles size={14} />
          <span>New AI Security Audit</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item justify-between",
                      isActive && "active"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon size={16} className={isActive ? "text-blue-400" : "text-slate-400"} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <ChevronRight size={13} className="text-blue-400/70 opacity-80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Security Health Indicator */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/20 text-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-semibold text-[11px]">Security Posture</span>
          </div>
          <span className="text-emerald-400 font-bold text-[11px]">99.4%</span>
        </div>
        <p className="text-[10px] text-slate-400">0 Critical Vulnerabilities</p>
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-white/[0.07] p-3 space-y-1 bg-slate-950/40">
        <Link
          href="/settings"
          className={cn(
            "sidebar-nav-item",
            pathname.startsWith("/settings") && "active"
          )}
        >
          <Settings size={16} />
          <span>Organization Settings</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors mt-1 group">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name || ""}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name, user?.email)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">
              {user?.name || user?.email?.split("@")[0] || "Staff Engineer"}
            </p>
            <p className="text-slate-400 text-[10px] truncate leading-tight mt-0.5">
              {user?.email || "developer@enterprise.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out of account"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
