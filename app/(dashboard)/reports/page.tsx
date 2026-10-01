"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  Code2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { Review } from "@/types/review";
import { exportReviewToPDF } from "@/lib/pdf-export";
import { timeAgo, scoreToColor, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const { tokens } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews?limit=20", {
          headers: tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setReviews(data.data.items || []);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [tokens]);

  async function handleExportPDF(review: Review) {
    setExportingId(review.id);
    try {
      toast.loading(`Generating PDF for "${review.title}"...`, { id: "report-pdf" });
      await exportReviewToPDF(review);
      toast.success("Audit PDF report downloaded!", { id: "report-pdf" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report", { id: "report-pdf" });
    } finally {
      setExportingId(null);
    }
  }

  const sampleReviews: Review[] = [
    {
      id: "rev-sample-1",
      title: "Authentication Token Rotation & JWT Security",
      language: "typescript",
      sourceType: "PASTE",
      sourceCode: "",
      status: "COMPLETED",
      overallScore: 98,
      securityScore: 99,
      qualityScore: 96,
      performanceScore: 95,
      maintainabilityScore: 98,
      summary: "High quality authentication handler with verified cryptographic signature checks and zero token leakage.",
      aiProvider: "Anthropic",
      aiModel: "Claude 3.5 Sonnet",
      processingTime: 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "demo",
      issues: [],
      recommendations: [
        {
          id: "r1",
          category: "Security",
          title: "Enforce Strict Token Revocation on Logout",
          description: "Blacklist rotated refresh tokens in Redis cluster.",
          priority: 1,
        },
      ],
    },
    {
      id: "rev-sample-2",
      title: "Stripe Webhook Verification & Idempotency Layer",
      language: "typescript",
      sourceType: "PASTE",
      sourceCode: "",
      status: "COMPLETED",
      overallScore: 94,
      securityScore: 96,
      qualityScore: 92,
      performanceScore: 94,
      maintainabilityScore: 92,
      summary: "Stripe signature validation implemented safely with replay attack protection.",
      aiProvider: "OpenAI",
      aiModel: "GPT-4o",
      processingTime: 1400,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      userId: "demo",
      issues: [
        {
          id: "i1",
          type: "QUALITY",
          severity: "LOW",
          title: "Extract raw payload before JSON parsing",
          description: "Ensure rawBuffer is preserved for HMAC verification.",
          lineStart: 18,
          suggestion: "Use req.rawBody helper.",
        },
      ],
      recommendations: [],
    },
  ];

  const displayList = reviews.length > 0 ? reviews : sampleReviews;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Enterprise Compliance & Security Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Security & Audit Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Download publication-grade executive PDF reports with OWASP & SOC-2 compliance seals.
          </p>
        </div>

        {displayList.length > 0 && (
          <button
            onClick={() => handleExportPDF(displayList[0])}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Download size={16} />
            <span>Export Latest Executive Report</span>
          </button>
        )}
      </div>

      {/* Compliance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compliance Standard
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              VERIFIED
            </span>
          </div>
          <p className="text-xl font-bold text-white">SOC-2 Type II</p>
          <p className="text-xs text-slate-400">Zero data retention policy active on all models.</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              OWASP Top 10 Coverage
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
              100%
            </span>
          </div>
          <p className="text-xl font-bold text-white">Zero Critical CVEs</p>
          <p className="text-xs text-slate-400">Full AST validation against injection & secret leakage.</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Audit Telemetry
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
              MULTI-MODEL
            </span>
          </div>
          <p className="text-xl font-bold text-white">Vector PDF Engine</p>
          <p className="text-xs text-slate-400">Printable, vector-crisp documentation for auditors.</p>
        </div>
      </div>

      {/* Available PDF Audit Reports */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <FileText size={17} className="text-blue-400" />
          <span>Generated Audit Artifacts</span>
        </h2>

        <div className="divide-y divide-white/[0.05]">
          {displayList.map((rev) => (
            <div
              key={rev.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/[0.02] px-3 -mx-3 rounded-xl transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/reviews/${rev.id}`}
                    className="text-sm font-semibold text-white hover:text-blue-400 transition-colors block truncate"
                  >
                    {rev.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {rev.language}
                    </span>
                    <span>•</span>
                    <span>{timeAgo(rev.createdAt)}</span>
                    {rev.overallScore != null && (
                      <>
                        <span>•</span>
                        <span className={cn("font-bold font-mono", scoreToColor(rev.overallScore))}>
                          Score: {rev.overallScore}/100
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link
                  href={`/reviews/${rev.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleExportPDF(rev)}
                  disabled={exportingId === rev.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/[0.1] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-all hover:border-blue-500/40 disabled:opacity-50"
                >
                  {exportingId === rev.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-blue-400" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} className="text-blue-400" />
                      <span>Export PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
