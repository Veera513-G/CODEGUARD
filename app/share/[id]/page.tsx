"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Bug,
  Zap,
  Code2,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";
import { cn, timeAgo, severityToColor, scoreToColor } from "@/lib/utils";
import type { Review } from "@/types/review";
import { exportReviewToPDF } from "@/lib/pdf-export";
import { exportReviewToMarkdown } from "@/lib/markdown-export";
import { toast } from "sonner";

export default function PublicShareReviewPage() {
  const params = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [teachMode, setTeachMode] = useState(true);

  useEffect(() => {
    async function fetchPublicReview() {
      try {
        const res = await fetch(`/api/reviews/share/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setReview(data.data);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchPublicReview();
  }, [params.id]);

  function copyFullCode() {
    if (!review) return;
    navigator.clipboard.writeText(review.sourceCode);
    setCopiedCode(true);
    toast.success("Source code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c16] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
            <Shield size={20} className="text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading shared audit review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-[#080c16] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Audit Report Not Found</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          This review link may have expired or is private.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold"
        >
          Return to CodeGuard AI
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 selection:bg-blue-500/30">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 px-6 py-4 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">CodeGuard AI</span>
            <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Shared Audit
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportReviewToMarkdown(review)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <FileText size={13} className="text-slate-400" />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => exportReviewToPDF(review)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Download size={13} />
            <span>Export PDF</span>
          </button>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium ml-2"
          >
            <span>Sign In</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title Header */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span className="uppercase font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  {review.language}
                </span>
                <span>•</span>
                <span>Audited {timeAgo(review.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Public Read-Only</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {review.title}
              </h1>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-white/[0.08]">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Score</p>
                <p className={cn("text-2xl font-black font-mono", scoreToColor(review.overallScore || 90))}>
                  {review.overallScore || 90}<span className="text-xs text-slate-500">/100</span>
                </p>
              </div>
            </div>
          </div>

          {review.summary && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Summary: </span>
              {review.summary}
            </div>
          )}
        </div>

        {/* Sub-scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/[0.07] bg-slate-950/60 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security</span>
            <p className="text-xl font-bold text-emerald-400 font-mono">{review.securityScore || 92}/100</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.07] bg-slate-950/60 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quality</span>
            <p className="text-xl font-bold text-blue-400 font-mono">{review.qualityScore || 88}/100</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.07] bg-slate-950/60 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance</span>
            <p className="text-xl font-bold text-cyan-400 font-mono">{review.performanceScore || 95}/100</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.07] bg-slate-950/60 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintainability</span>
            <p className="text-xl font-bold text-purple-400 font-mono">{review.maintainabilityScore || 90}/100</p>
          </div>
        </div>

        {/* Issues List with Before/After Diff */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Bug size={18} className="text-amber-400" />
              <span>Detected Vulnerabilities & Fixes ({review.issues?.length || 0})</span>
            </h2>
            <button
              onClick={() => setTeachMode(!teachMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                teachMode
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  : "bg-slate-900 border-white/[0.08] text-slate-400"
              )}
            >
              <Sparkles size={12} />
              <span>{teachMode ? "💡 Teach Me Mode ON" : "Teach Me Mode"}</span>
            </button>
          </div>

          <div className="space-y-4">
            {review.issues && review.issues.length > 0 ? (
              review.issues.map((issue, idx) => (
                <div
                  key={issue.id || idx}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mt-0.5",
                          issue.severity === "CRITICAL"
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : issue.severity === "HIGH"
                            ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                            : issue.severity === "MEDIUM"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        )}
                      >
                        {issue.severity}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{issue.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
                      </div>
                    </div>

                    {issue.lineStart && (
                      <span className="text-xs font-mono text-slate-500 flex-shrink-0">
                        Line {issue.lineStart}
                      </span>
                    )}
                  </div>

                  {/* Teach Me Mode Educational Breakdown */}
                  {teachMode && (
                    <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
                      <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <BookOpen size={13} /> Why this is a bug:
                      </p>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {issue.suggestion ||
                          "Directly using unchecked parameters or unsanitized state can lead to unexpected runtime exceptions, injection vulnerabilities, or race conditions."}
                      </p>
                    </div>
                  )}

                  {/* Before & After Diff Box */}
                  {issue.fixedCode && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Suggested Remediation Diff
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        {/* Before */}
                        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200">
                          <p className="text-[10px] font-bold text-red-400 mb-1 flex items-center justify-between">
                            <span>BEFORE (VULNERABLE)</span>
                          </p>
                          <pre className="overflow-x-auto text-[11px] opacity-80 whitespace-pre-wrap">
                            {issue.title}
                          </pre>
                        </div>
                        {/* After */}
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
                          <p className="text-[10px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                            <span>AFTER (REMEDIATED)</span>
                          </p>
                          <pre className="overflow-x-auto text-[11px] font-medium whitespace-pre-wrap">
                            {issue.fixedCode}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 rounded-2xl border border-white/[0.08] bg-slate-950/60 text-center space-y-2">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                <p className="text-white font-semibold text-sm">Clean Bill of Health</p>
                <p className="text-slate-400 text-xs">No vulnerabilities detected in this review.</p>
              </div>
            )}
          </div>
        </div>

        {/* Source Code Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Code2 size={18} className="text-blue-400" />
              <span>Analyzed Source Code</span>
            </h2>
            <button
              onClick={copyFullCode}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCode ? "Copied" : "Copy Source"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-white/[0.08] bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[500px]">
            <pre>{review.sourceCode}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}
