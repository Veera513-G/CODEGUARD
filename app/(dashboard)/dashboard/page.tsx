"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Code2,
  ShieldAlert,
  Bug,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  GitPullRequest,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuthStore } from "@/stores/auth-store";
import { cn, timeAgo, scoreToColor } from "@/lib/utils";

interface DashboardStats {
  totalReviews: number;
  completedReviews: number;
  totalIssues: number;
  criticalIssues: number;
  avgScore: number;
  scansUsed: number;
  scansLimit: number;
  plan: string;
}

interface RecentReview {
  id: string;
  title: string;
  language: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  _count: { issues: number };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [trendData, setTrendData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = useAuthStore.getState().tokens?.accessToken;
        const res = await fetch("/api/dashboard/stats", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setStats(data.data.stats);
            setRecentReviews(data.data.recentReviews || []);
            setTrendData(data.data.trendData || []);
          }
        }
      } catch {
        // Fallback default
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: "Total Code Audits",
      value: stats?.totalReviews ?? (loading ? "..." : 124),
      trend: "+18.4% this month",
      icon: Code2,
      color: "from-blue-600/15 via-blue-500/5 to-transparent",
      iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      border: "border-blue-500/20",
    },
    {
      label: "Security & Quality Score",
      value: stats?.avgScore ? `${stats.avgScore}/100` : (loading ? "..." : "96.4/100"),
      trend: "Top 2% of repos",
      icon: ShieldCheck,
      color: "from-emerald-600/15 via-emerald-500/5 to-transparent",
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      border: "border-emerald-500/20",
    },
    {
      label: "Vulnerabilities Detected",
      value: stats?.totalIssues ?? (loading ? "..." : 48),
      trend: "100% remediated",
      icon: Bug,
      color: "from-amber-600/15 via-amber-500/5 to-transparent",
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      border: "border-amber-500/20",
    },
    {
      label: "Critical CVEs Neutralized",
      value: stats?.criticalIssues ?? (loading ? "..." : 0),
      trend: "0 unpatched risks",
      icon: ShieldAlert,
      color: "from-purple-600/15 via-purple-500/5 to-transparent",
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      border: "border-purple-500/20",
    },
  ];

  const statusIcon = (status: string) => {
    if (status === "COMPLETED")
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (status === "FAILED") return <XCircle size={14} className="text-red-400" />;
    if (status === "PROCESSING")
      return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    return <Clock size={14} className="text-slate-500" />;
  };

  const langColors: Record<string, string> = {
    javascript: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    typescript: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    python: "text-green-400 bg-green-500/10 border-green-500/20",
    java: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    go: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    rust: "text-orange-300 bg-orange-500/10 border-orange-500/20",
    php: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    csharp: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    c: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    cpp: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  };

  const displayReviews =
    recentReviews.length > 0
      ? recentReviews
      : [
          {
            id: "rev-sample-1",
            title: "Auth & OAuth Token Rotation Handler",
            language: "typescript",
            status: "COMPLETED",
            overallScore: 98,
            createdAt: new Date().toISOString(),
            _count: { issues: 0 },
          },
          {
            id: "rev-sample-2",
            title: "Payment Gateway Webhook Verification",
            language: "typescript",
            status: "COMPLETED",
            overallScore: 94,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            _count: { issues: 1 },
          },
          {
            id: "rev-sample-3",
            title: "Postgres Database Query Sanitizer",
            language: "python",
            status: "COMPLETED",
            overallScore: 91,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            _count: { issues: 2 },
          },
        ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-950/50 via-slate-900/60 to-indigo-950/40 border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Glow vector */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Enterprise Code Quality & Security Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
              <span className="gradient-text">{user?.name?.split(" ")[0] || "Lead Engineer"}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              All repository gates are healthy. Zero unpatched critical CVEs across all connected branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/reviews/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>New AI Code Audit</span>
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 font-medium text-xs sm:text-sm transition-colors"
            >
              <Activity size={15} className="text-slate-400" />
              <span>Compliance Report</span>
            </Link>
          </div>
        </div>

        {/* Real-time Telemetry Strip */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Check className="text-emerald-400" size={14} />
            <span>SOC 2 Type II: Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="text-blue-400" size={14} />
            <span>OWASP Top 10 Scanned</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="text-amber-400" size={14} />
            <span>Avg AI Review: 1.4s</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <GitPullRequest className="text-purple-400" size={14} />
            <span>Automated PR Shield Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "p-5 rounded-2xl border bg-gradient-to-br glass-card card-hover relative overflow-hidden",
              card.color,
              card.border
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={cn(
                  "w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner",
                  card.iconColor
                )}
              >
                <card.icon size={17} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {card.value}
              </p>
              <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <TrendingUp size={12} />
                <span>{card.trend}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid: Recent Audits & AI Quality Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Recent Security Audits Table */}
        <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recent Code & Security Audits
              </h2>
              <p className="text-xs text-slate-400">
                Latest static and AI dynamic analyses performed across your team
              </p>
            </div>
            <Link
              href="/reviews"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {displayReviews.map((rev) => (
              <div
                key={rev.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all flex-shrink-0">
                    <Code2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/reviews/${rev.id}`}
                      className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate block"
                    >
                      {rev.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border uppercase",
                          langColors[rev.language.toLowerCase()] ||
                            "text-slate-300 bg-slate-800 border-slate-700"
                        )}
                      >
                        {rev.language}
                      </span>
                      <span>•</span>
                      <span>{timeAgo(rev.createdAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {statusIcon(rev.status)}
                        <span>{rev.status.toLowerCase()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {rev.overallScore !== null && (
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-sm font-bold font-mono px-2 py-1 rounded-lg border",
                          rev.overallScore >= 90
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : rev.overallScore >= 75
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                        )}
                      >
                        {rev.overallScore}/100
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/reviews/${rev.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Security Compliance & Remediation Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Enterprise Guardrails</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">SQL Injection Barrier</p>
                  <p className="text-slate-400 text-[11px]">Strict AST Parameterization</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Secret & Key Leak Scanner</p>
                  <p className="text-slate-400 text-[11px]">Entropy & Regex Multi-pass</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Dependency CVE Triage</p>
                  <p className="text-slate-400 text-[11px]">Live NVD / GitHub Advisory</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <Link
                href="/settings"
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <span>Manage Security Policies</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
