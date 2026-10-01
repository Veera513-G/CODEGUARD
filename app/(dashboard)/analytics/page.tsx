"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShieldCheck,
  Award,
  Zap,
  Bug,
  Code2,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const trendData = [
  { month: "May", securityScore: 78, bugsFixed: 12, scans: 24 },
  { month: "Jun", securityScore: 82, bugsFixed: 18, scans: 36 },
  { month: "Jul", securityScore: 85, bugsFixed: 22, scans: 48 },
  { month: "Aug", securityScore: 91, bugsFixed: 34, scans: 64 },
  { month: "Sep", securityScore: 94, bugsFixed: 42, scans: 88 },
  { month: "Oct", securityScore: 98, bugsFixed: 56, scans: 112 },
];

const languageShare = [
  { language: "TypeScript", count: 48, fill: "#3b82f6" },
  { language: "Python", count: 34, fill: "#10b981" },
  { language: "Go", count: 18, fill: "#06b6d4" },
  { language: "Java", count: 12, fill: "#f59e0b" },
  { language: "Rust", count: 8, fill: "#ec4899" },
];

const badges = [
  {
    id: "b1",
    title: "Zero-Day Sentinel",
    description: "Identified and neutralized 5+ critical security vulnerabilities",
    icon: "🛡️",
    unlocked: true,
    category: "Security",
    xp: "+500 XP",
  },
  {
    id: "b2",
    title: "Clean Code Champion",
    description: "Achieved a 95+ code quality audit score on 10 consecutive reviews",
    icon: "💎",
    unlocked: true,
    category: "Quality",
    xp: "+400 XP",
  },
  {
    id: "b3",
    title: "100% Security Streak",
    description: "Maintained a spotless zero-vulnerability pipeline for 7 days",
    icon: "🔥",
    unlocked: true,
    category: "Consistency",
    xp: "+350 XP",
  },
  {
    id: "b4",
    title: "AI Power Reviewer",
    description: "Used AI interactive code chat to refactor and optimize code",
    icon: "🧠",
    unlocked: true,
    category: "Learning",
    xp: "+250 XP",
  },
  {
    id: "b5",
    title: "AST Master Architect",
    description: "Resolved all parameterized query and AST syntax recommendations",
    icon: "⚡",
    unlocked: false,
    category: "Architecture",
    xp: "+600 XP",
  },
  {
    id: "b6",
    title: "Enterprise Gatekeeper",
    description: "Exported verified SOC-2 compliance audit reports for production",
    icon: "👑",
    unlocked: false,
    category: "Enterprise",
    xp: "+750 XP",
  },
];

const quizQuestions = [
  {
    question: "Which of the following is the most effective defense against SQL Injection?",
    options: [
      "Escaping special characters with regex",
      "Using Parameterized Queries / Prepared Statements (AST validation)",
      "Encoding the query in Base64",
      "Shortening database column lengths",
    ],
    correct: 1,
    explanation:
      "Parameterized queries treat user input strictly as data, never as executable SQL commands, preventing injection entirely.",
  },
  {
    question: "Why should API secrets and private keys never be committed to Git?",
    options: [
      "It makes the repository download size too large",
      "Git commit history is permanent and accessible to anyone with repo read access",
      "It slows down git push speed",
      "Git cannot serialize JSON objects",
    ],
    correct: 1,
    explanation:
      "Even if removed in later commits, secrets remain stored in Git commit tree history and can be easily dumped.",
  },
];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [userScore, setUserScore] = useState(1250);

  const currentQuiz = quizQuestions[currentQuizIdx];

  function handleAnswer(index: number) {
    if (quizAnswered) return;
    setSelectedAnswer(index);
    setQuizAnswered(true);

    if (index === currentQuiz.correct) {
      setUserScore((prev) => prev + 100);
      toast.success("Correct answer! +100 XP awarded 🎉");
    } else {
      toast.error("Not quite! Check the explanation below.");
    }
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setQuizAnswered(false);
    setCurrentQuizIdx((prev) => (prev + 1) % quizQuestions.length);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <TrendingUp size={14} className="text-cyan-400" />
            <span>Telemetry & Engineering Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Security History & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track code quality evolution over time, unlock security achievements, and test your knowledge.
          </p>
        </div>

        {/* Gamification Score Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900/60 border border-white/[0.08] shadow-lg">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-md">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-300 font-semibold">Security Level:</span>
              <span className="text-xs font-bold text-blue-400">Master Level 4</span>
            </div>
            <p className="text-lg font-black text-white font-mono">{userScore.toLocaleString()} XP</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Security Score</span>
          <p className="text-3xl font-black text-emerald-400 font-mono">98.2<span className="text-sm font-normal text-slate-500">/100</span></p>
          <p className="text-xs text-emerald-400 font-medium">↑ +20.4 pts over 6 months</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Remediated CVEs</span>
          <p className="text-3xl font-black text-white font-mono">194</p>
          <p className="text-xs text-blue-400 font-medium">100% Patch Success Rate</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mean Time to Fix</span>
          <p className="text-3xl font-black text-cyan-400 font-mono">&lt; 3.2m</p>
          <p className="text-xs text-cyan-400 font-medium">10x faster with 1-Click Auto-Fix</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clean PR Pass Rate</span>
          <p className="text-3xl font-black text-purple-400 font-mono">99.4%</p>
          <p className="text-xs text-purple-400 font-medium">Zero blocker regressions</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Historical Security Score Evolution */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Security Score Evolution Over Time
              </h2>
              <p className="text-xs text-slate-400">
                Continuous improvement trajectory across all repositories
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              ● All Systems Passing
            </span>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="securityScore"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreColor)"
                  name="Security Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Language Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Code Volume by Language
          </h2>
          <p className="text-xs text-slate-400">
            Multi-language audit distribution
          </p>

          <div className="space-y-3 pt-2">
            {languageShare.map((item) => (
              <div key={item.language} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{item.language}</span>
                  <span className="font-mono text-slate-400">{item.count} scans</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / 120) * 100}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gamification: Badges Showcase & Interactive Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Security Badges & Achievements */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Award size={18} className="text-yellow-400" />
                <span>Security Badges & Achievements</span>
              </h2>
              <p className="text-xs text-slate-400">
                Earn reputation badges by fixing defects, mastering patterns, and maintaining high scores
              </p>
            </div>
            <span className="text-xs font-bold text-yellow-400 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              4 / 6 Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "p-4 rounded-xl border transition-all space-y-2",
                  b.unlocked
                    ? "bg-slate-900/80 border-white/[0.08] hover:border-blue-500/30"
                    : "bg-slate-950/40 border-white/[0.04] opacity-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {b.xp}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{b.title}</span>
                    {b.unlocked && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Interactive Security Quiz */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles size={17} className="text-cyan-400" />
              <span>Daily Security Quiz</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Q{currentQuizIdx + 1} of {quizQuestions.length}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-200">
            {currentQuiz.question}
          </p>

          <div className="space-y-2">
            {currentQuiz.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQuiz.correct;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={quizAnswered}
                  className={cn(
                    "w-full p-3 rounded-xl text-left text-xs font-medium border transition-all leading-relaxed",
                    quizAnswered
                      ? isCorrect
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold"
                        : isSelected
                        ? "bg-red-500/20 border-red-500/40 text-red-200"
                        : "bg-slate-900/40 border-white/[0.04] text-slate-400"
                      : "bg-slate-900/80 border-white/[0.06] hover:bg-slate-800 text-slate-300 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizAnswered && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-2">
              <p className="text-blue-400 font-bold">💡 Why:</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                {currentQuiz.explanation}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold flex items-center gap-1"
                >
                  <span>Next Question</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
