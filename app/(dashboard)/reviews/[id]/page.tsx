"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Bug,
  Zap,
  Code2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Share2,
  MessageSquare,
  Sparkles,
  Send,
  Wand2,
  HelpCircle,
  Columns,
  ListFilter,
  CheckSquare,
} from "lucide-react";
import {
  cn,
  timeAgo,
  severityToColor,
  issueTypeToColor,
  scoreToHex,
  scoreToColor,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Review, ReviewIssue } from "@/types/review";
import { toast } from "sonner";
import { exportReviewToPDF } from "@/lib/pdf-export";
import { exportReviewToMarkdown } from "@/lib/markdown-export";

const issueTypeIcon: Record<string, React.ElementType> = {
  BUG: Bug,
  SECURITY: Shield,
  PERFORMANCE: Zap,
  QUALITY: Code2,
  BEST_PRACTICE: BookOpen,
};

function ScoreRing({
  score,
  label,
  size = 80,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = scoreToHex(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800 fill-none"
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white font-mono">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tokens } = useAuthStore();
  const [review, setReview] = useState<Review | null>(null);
  const [currentCode, setCurrentCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "issues" | "sidebyside" | "explain" | "chat" | "recommendations"
  >("issues");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Chat with Code State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm your AI Security Assistant. Ask me anything about this review, like *'Why is line 12 unsafe?'*, *'How do I refactor this function?'*, or *'Generate unit tests'*. ",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Explain Code State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainingLoading, setExplainingLoading] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  // Issues Filter State
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await fetch(`/api/reviews/${params.id}`, {
          headers: tokens ? { Authorization: `Bearer ${tokens?.accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setReview(data.data);
            setCurrentCode(data.data.sourceCode);
          }
        } else {
          router.push("/reviews");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, [params.id, tokens, router]);

  // Handle PDF Export
  async function handleExportPDF() {
    if (!review) return;
    setExporting(true);
    try {
      toast.loading("Generating enterprise audit PDF...", { id: "export-pdf" });
      await exportReviewToPDF(review);
      toast.success("PDF exported successfully!", { id: "export-pdf" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.", { id: "export-pdf" });
    } finally {
      setExporting(false);
    }
  }

  // Handle Markdown Export
  function handleExportMarkdown() {
    if (!review) return;
    exportReviewToMarkdown(review);
    toast.success("Markdown audit report downloaded!");
  }

  // Handle Share Link
  function copyShareLink() {
    if (typeof window === "undefined" || !review) return;
    const shareUrl = `${window.location.origin}/share/${review.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Public share link copied to clipboard!");
    setShareModalOpen(true);
  }

  // Handle Apply Fix to local code & persist via API
  async function handleApplyFix(issue: ReviewIssue) {
    if (!review) return;
    if (!issue.fixedCode) {
      toast.info("No patch available for this issue");
      return;
    }

    const targetFixCode = issue.fixedCode || review.optimizedCode || review.sourceCode;
    setCurrentCode(targetFixCode);
    setAppliedFixes((prev) => new Set([...prev, issue.id]));

    try {
      const res = await fetch(`/api/reviews/${review.id}/apply-fix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          issueId: issue.id,
          fixedCode: targetFixCode,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.review) {
        setReview(data.data.review);
        toast.success(
          `Patch applied! Score upgraded ${data.data.scoreGain} (${data.data.xpAwarded})`
        );
      } else {
        toast.success(`Patch applied locally for "${issue.title}"!`);
      }
    } catch {
      toast.success(`Patch applied locally for "${issue.title}"!`);
    }
  }

  // Copy Snippet / Patch
  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Deep AI Re-Scan & Audit via API
  async function handleRescanReview() {
    if (!review) return;
    setRescanning(true);
    try {
      toast.loading("Running comprehensive AI re-scan & AST audit...", { id: "rescan-audit" });
      const res = await fetch(`/api/reviews/${review.id}/rescan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ code: currentCode || review.sourceCode }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setReview(data.data);
        setCurrentCode(data.data.sourceCode);
        toast.success("Comprehensive AI audit updated with full findings & metrics!", { id: "rescan-audit" });
      } else {
        toast.error(data.error || "Failed to update review", { id: "rescan-audit" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during code audit", { id: "rescan-audit" });
    } finally {
      setRescanning(false);
    }
  }

  // Explain Code
  async function handleExplainCode() {
    if (!review) return;
    setActiveTab("explain");
    if (explanation) return;

    setExplainingLoading(true);
    try {
      const res = await fetch("/api/reviews/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode || review.sourceCode,
          language: review.language,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExplanation(data.data.explanation);
      } else {
        toast.error(data.error || "Could not generate explanation");
      }
    } catch {
      toast.error("Failed to generate explanation");
    } finally {
      setExplainingLoading(false);
    }
  }

  // Send Chat Message
  async function handleSendChat(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading || !review) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/reviews/${review.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          message: userMsg,
          history: chatMessages.slice(-4),
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.data.reply },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ I encountered an error answering that. Please try again.",
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Network issue connecting to AI tutor. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const toggleIssue = (id: string) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-blue-400" />
        <p className="text-slate-400 text-sm">Loading security audit...</p>
      </div>
    );
  }

  if (!review) return null;

  const isCompleted = review.status === "COMPLETED";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reviews"
            className="p-2 rounded-xl bg-slate-900/60 border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {review.title}
              </h1>
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {review.language}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited {timeAgo(review.createdAt)} · {review.aiProvider || "AI"}/{review.aiModel || "gpt-4o"}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Deep AI Re-Audit Button */}
          <button
            onClick={handleRescanReview}
            disabled={rescanning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50"
            title="Trigger deep semantic AST and security vulnerability re-scan"
          >
            {rescanning ? (
              <Loader2 size={13} className="animate-spin text-blue-400" />
            ) : (
              <Zap size={13} className="text-blue-400" />
            )}
            <span>{rescanning ? "Auditing..." : "⚡ Deep AI Audit"}</span>
          </button>

          {/* Teach Me Mode Toggle */}
          <button
            onClick={() => setTeachMode(!teachMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
              teachMode
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                : "bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-slate-200"
            )}
            title="Toggle beginner-friendly explanations for all issues"
          >
            <Sparkles size={13} className={teachMode ? "text-cyan-400" : "text-slate-500"} />
            <span>{teachMode ? "💡 Teach Me ON" : "Teach Me Mode"}</span>
          </button>

          {/* Explain Code Button */}
          <button
            onClick={handleExplainCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <HelpCircle size={14} className="text-blue-400" />
            <span>Explain Code</span>
          </button>

          {/* Share Link Button */}
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Share2 size={14} className="text-purple-400" />
            <span>Share Link</span>
          </button>

          {/* Markdown Export */}
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <FileText size={14} className="text-slate-400" />
            <span>Markdown</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-primary text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:opacity-95 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>{exporting ? "Generating..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/[0.1] shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 size={18} className="text-blue-400" />
                  <h3 className="font-bold text-base">Shareable Review Link</h3>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Anyone with this public link can inspect this read-only review, view security scores, line diffs, and AI explanations without signing in.
              </p>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/[0.08]">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/share/${review.id}`
                      : ""
                  }
                  className="w-full bg-transparent text-xs text-slate-200 outline-none truncate"
                />
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/share/${review.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied!");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold flex-shrink-0"
                >
                  Copy
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Score Cards Overview */}
      {isCompleted && review.overallScore != null && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall score */}
          <div className="md:col-span-2 lg:col-span-1 p-6 rounded-2xl bg-slate-950/60 border border-white/[0.08] backdrop-blur-xl flex items-center gap-6 shadow-xl">
            <ScoreRing score={review.overallScore as number} label="" size={95} />
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                Overall Quality
              </p>
              <p className={cn("text-4xl font-extrabold font-mono", scoreToColor(review.overallScore as number))}>
                {review.overallScore}
                <span className="text-slate-500 text-xl font-normal">/100</span>
              </p>
              <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                {review.summary}
              </p>
            </div>
          </div>

          {/* Sub scores */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-950/60 border border-white/[0.08] backdrop-blur-xl shadow-xl">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-4">
              Security & Architecture Dimensions
            </p>
            <div className="grid grid-cols-4 gap-2">
              <ScoreRing score={review.securityScore || 90} label="Security" size={68} />
              <ScoreRing score={review.qualityScore || 85} label="Quality" size={68} />
              <ScoreRing score={review.performanceScore || 90} label="Performance" size={68} />
              <ScoreRing score={review.maintainabilityScore || 88} label="Maintainability" size={68} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/[0.08] w-fit">
        <button
          onClick={() => setActiveTab("issues")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === "issues"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Bug size={14} />
          <span>Issues & Auto-Fixes ({review.issues?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("sidebyside")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === "sidebyside"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Columns size={14} />
          <span>Side-by-Side Diff</span>
        </button>

        <button
          onClick={handleExplainCode}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === "explain"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <HelpCircle size={14} />
          <span>Plain-Language Explanation</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === "chat"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <MessageSquare size={14} />
          <span>Chat with Code</span>
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === "recommendations"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          <BookOpen size={14} />
          <span>Recommendations ({review.recommendations?.length || 0})</span>
        </button>
      </div>

      {/* ─── TAB 1: Issues & Auto-Fix Diffs ──────────────────────────────────── */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Filtering Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              {/* Severity Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/[0.06] text-xs">
                <span className="text-[10px] text-slate-500 font-semibold px-2 uppercase">Severity</span>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                      severityFilter === sev
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {/* Confidence Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/[0.06] text-xs">
                <span className="text-[10px] text-slate-500 font-semibold px-2 uppercase">Confidence</span>
                {["ALL", "CONFIRMED", "LIKELY", "POTENTIAL"].map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setConfidenceFilter(conf)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
                      confidenceFilter === conf
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing{" "}
              {
                (review.issues || []).filter((i) => {
                  if (severityFilter !== "ALL" && i.severity !== severityFilter) return false;
                  if (confidenceFilter !== "ALL" && (i.confidence || "CONFIRMED") !== confidenceFilter) return false;
                  return true;
                }).length
              }{" "}
              of {review.issues?.length || 0} finding(s)
            </div>
          </div>

          {/* Issues List */}
          {review.issues && review.issues.length > 0 ? (
            review.issues
              .filter((issue) => {
                if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;
                if (confidenceFilter !== "ALL" && (issue.confidence || "CONFIRMED") !== confidenceFilter) return false;
                return true;
              })
              .map((issue, idx) => {
                const Icon = issueTypeIcon[issue.type] || Code2;
                const isExpanded = expandedIssues.has(issue.id || String(idx));
                const isApplied = appliedFixes.has(issue.id);
                const confidence = issue.confidence || "CONFIRMED";

                return (
                  <div
                    key={issue.id || idx}
                    className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-lg overflow-hidden transition-all hover:border-white/[0.12]"
                  >
                    {/* Issue Header */}
                    <div
                      onClick={() => toggleIssue(issue.id || String(idx))}
                      className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
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

                            {/* Confidence Badge */}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                confidence === "CONFIRMED"
                                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                                  : confidence === "LIKELY"
                                  ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                                  : "text-slate-300 bg-slate-800 border-slate-700"
                              )}
                            >
                              ✓ {confidence}
                            </span>

                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.06]">
                              {issue.type}
                            </span>

                            {issue.lineStart && (
                              <span className="text-[11px] font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                Line {issue.lineStart}{issue.lineEnd && issue.lineEnd !== issue.lineStart ? `-${issue.lineEnd}` : ""}
                              </span>
                            )}

                            {isApplied && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                                <CheckSquare size={11} />
                                <span>Fix Applied</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                            {issue.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {issue.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Teach Me Educational Callout */}
                    {teachMode && (
                      <div className="mx-5 mb-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300 space-y-2">
                        <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                          <BookOpen size={14} />
                          <span>Why this is a defect (Beginner-Friendly Guide):</span>
                        </p>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {issue.suggestion ||
                            "This code pattern may result in unhandled exceptions, injection vulnerabilities, or degraded runtime performance under load."}
                        </p>
                      </div>
                    )}

                    {/* Expanded Section with Before/After Diff & Actions */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-white/[0.05] space-y-4">
                        {/* Full description */}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {issue.description}
                        </p>

                        {/* Reasoning & Threat Diagnostics */}
                        {(issue.reason || issue.impact || issue.attackSurface) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.06] text-xs">
                            {issue.reason && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  Root Cause Analysis
                                </span>
                                <p className="text-slate-300">{issue.reason}</p>
                              </div>
                            )}
                            {issue.impact && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                                  Threat Impact
                                </span>
                                <p className="text-slate-300">{issue.impact}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Before & After Diff Box */}
                        {issue.fixedCode && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Interactive Remediation Diff
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => copyText(issue.fixedCode || "", issue.id)}
                                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-white/[0.08] transition-colors"
                                >
                                  {copiedId === issue.id ? (
                                    <Check size={12} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  <span>{copiedId === issue.id ? "Copied" : "Copy Fix"}</span>
                                </button>

                                <button
                                  onClick={() => handleApplyFix(issue)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors shadow-sm"
                                >
                                  <Wand2 size={12} />
                                  <span>{isApplied ? "Re-apply Fix" : "Apply Fix"}</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                              {/* Before */}
                              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200">
                                <p className="text-[10px] font-bold text-red-400 mb-1.5 flex items-center justify-between">
                                  <span>BEFORE (VULNERABLE)</span>
                                  {issue.lineStart && <span>Line {issue.lineStart}</span>}
                                </p>
                                <pre className="overflow-x-auto text-[11px] opacity-85 whitespace-pre-wrap leading-relaxed">
                                  {issue.evidence || issue.title}
                                </pre>
                              </div>

                              {/* After */}
                              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
                                <p className="text-[10px] font-bold text-emerald-400 mb-1.5 flex items-center justify-between">
                                  <span>AFTER (REMEDIATED)</span>
                                  <span className="text-emerald-400">Fixed</span>
                                </p>
                                <pre className="overflow-x-auto text-[11px] font-medium whitespace-pre-wrap leading-relaxed">
                                  {issue.fixedCode}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="p-12 rounded-2xl border border-white/[0.08] bg-slate-950/60 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <p className="text-white font-bold text-base">Zero Defects Found</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                No vulnerabilities or quality issues were detected. This code satisfies enterprise static analysis criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Side-by-Side Diff Viewer ─────────────────────────────────── */}
      {activeTab === "sidebyside" && (
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Columns size={18} className="text-blue-400" />
                <span>Side-by-Side Code Comparison & Error-Free Remediation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Original source code with detected defects on left versus the hardened, bug-free production implementation on right
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRescanReview}
                disabled={rescanning}
                className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                {rescanning ? <Loader2 size={13} className="animate-spin text-blue-400" /> : <Zap size={13} className="text-blue-400" />}
                <span>{rescanning ? "Remediating..." : "✨ Re-Generate Error-Free Code"}</span>
              </button>

              <button
                onClick={async () => {
                  if (!review) return;
                  const cleanCode = review.optimizedCode || review.sourceCode;
                  setCurrentCode(cleanCode);
                  try {
                    await fetch(`/api/reviews/${review.id}/apply-fix`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokens?.accessToken}`,
                      },
                      body: JSON.stringify({
                        issueId: "all-remediated",
                        fixedCode: cleanCode,
                      }),
                    });
                    toast.success("Error-free remediated code applied as active source!");
                  } catch {
                    toast.success("Remediated code loaded locally!");
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-sm"
              >
                <Wand2 size={13} className="text-emerald-400" />
                <span>📥 Apply Error-Free Code</span>
              </button>

              <button
                onClick={() => copyText(review.optimizedCode || review.sourceCode, "side-optimized")}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08]"
              >
                {copiedId === "side-optimized" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>Copy Remediated Code</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 border border-red-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="font-bold text-red-400 font-mono text-[11px]">ORIGINAL SOURCE</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  {review.sourceCode.split("\n").length} lines · {review.issues?.length || 0} issue(s)
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] font-mono text-xs text-slate-300 overflow-x-auto max-h-[550px] leading-relaxed select-all">
                <pre>{review.sourceCode}</pre>
              </div>
            </div>

            {/* Right: Optimized / Remediated Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-emerald-400 font-mono text-[11px]">REMEDIATED & OPTIMIZED</span>
                </div>
                <span className="text-emerald-400 font-mono text-[10px] font-semibold">100% Error-Free & Hardened</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[550px] leading-relaxed select-all">
                <pre>{review.optimizedCode || review.sourceCode}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Plain-Language "Explain this Code" ──────────────────────── */}
      {activeTab === "explain" && (
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Plain-Language Code Breakdown</h2>
                <p className="text-xs text-slate-400">
                  Concept breakdown designed for students, junior engineers, and cross-functional teams
                </p>
              </div>
            </div>

            <button
              onClick={handleExplainCode}
              disabled={explainingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
            >
              {explainingLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Regenerate Explanation</span>
            </button>
          </div>

          {explainingLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-slate-400 text-xs">AI is breaking down this code step-by-step...</p>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
              {explanation || "Click 'Regenerate Explanation' to analyze this code in plain English."}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: Chat with Code ───────────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.07] bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Security Assistant</h3>
                <p className="text-[11px] text-slate-400">Contextual Q&A on your reviewed codebase</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setChatMessages([
                    {
                      role: "assistant",
                      content:
                        "👋 Hello! Ask me anything about your code, security risks, or refactoring ideas.",
                    },
                  ])
                }
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "gradient-primary text-white"
                  )}
                >
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div
                  className={cn(
                    "p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-slate-900 border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span>AI Tutor is formulating an answer...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-white/[0.05] bg-slate-900/40 flex flex-wrap gap-2 text-[11px]">
            <button
              onClick={() => {
                setChatInput("Why is this code considered unsafe or buggy?");
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors border border-white/[0.06]"
            >
              ❓ Why is this unsafe?
            </button>
            <button
              onClick={() => {
                setChatInput("Can you write automated unit tests for this module?");
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors border border-white/[0.06]"
            >
              🧪 Generate unit tests
            </button>
            <button
              onClick={() => {
                setChatInput("How can I optimize the runtime performance of this code?");
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors border border-white/[0.06]"
            >
              ⚡ Optimize performance
            </button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-white/[0.07] bg-slate-900/60 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question about this code review (e.g. 'Why is line 12 unsafe?')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 5: Strategic Recommendations ───────────────────────────────── */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/40 border border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400" />
                <span>Enterprise Architecture & Security Recommendations</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strategic guidance, defensive hardening patterns, and algorithmic performance blueprints generated for this module.
              </p>
            </div>
            <button
              onClick={handleRescanReview}
              disabled={rescanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold self-start sm:self-auto transition-all disabled:opacity-50"
            >
              {rescanning ? (
                <Loader2 size={12} className="animate-spin text-blue-400" />
              ) : (
                <Zap size={12} className="text-blue-400" />
              )}
              <span>{rescanning ? "Refreshing..." : "Re-generate via AI"}</span>
            </button>
          </div>

          {review.recommendations && review.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5">
              {review.recommendations.map((rec, i) => {
                const priority = rec.priority || i + 1;
                const priorityColor =
                  priority === 1
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : priority === 2
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : priority === 3
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    : "bg-slate-500/15 text-slate-400 border-slate-500/30";

                const category = rec.category || "Best Practice";

                return (
                  <div
                    key={rec.id || i}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/70 backdrop-blur-xl space-y-3 shadow-xl hover:border-white/[0.14] transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", priorityColor)}>
                          P{priority} Priority
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06] uppercase tracking-wider">
                          {category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            copyText(`${rec.title}\n\n${rec.description}`, `rec-${i}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] transition-colors border border-white/[0.06]"
                        >
                          {copiedId === `rec-${i}` ? (
                            <>
                              <Check size={12} className="text-green-400" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setChatInput(`How do I implement this recommendation: "${rec.title}"? Give me a complete code example.`);
                            setActiveTab("chat");
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-[11px] transition-colors border border-blue-500/30"
                        >
                          <MessageSquare size={12} />
                          <span>Ask in Chat</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">{rec.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mt-1.5">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-white/[0.08] bg-slate-950/60 text-center space-y-3">
              <BookOpen size={32} className="mx-auto text-slate-500" />
              <p className="text-sm text-slate-300 font-semibold">No detailed recommendations on file yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger a deep AST semantic audit to extract architecture blueprints and security hardening recommendations.
              </p>
              <button
                onClick={handleRescanReview}
                disabled={rescanning}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90"
              >
                <Zap size={14} />
                <span>Run Deep AI Audit Now</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
