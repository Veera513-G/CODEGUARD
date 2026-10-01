"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Play } from "lucide-react";

const codeSnippet = `// Before CodeGuard AI
function getUserData(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return db.execute(query); // ⚠️ SQL Injection!
}

// After CodeGuard AI  ✅
function getUserData(id: string): Promise<User> {
  return db.execute(
    "SELECT * FROM users WHERE id = $1",
    [sanitize(id)]  // Parameterized & safe
  );
}`;

const stats = [
  { value: "50K+", label: "Developers" },
  { value: "2M+", label: "Scans Run" },
  { value: "98%", label: "Accuracy" },
  { value: "10x", label: "Faster Review" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 pulse-glow" />
                AI-Powered Code Review
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Ship{" "}
                <span className="gradient-text">bulletproof</span>{" "}
                code, faster
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-xl leading-relaxed mb-8 max-w-xl">
                Automatically detect bugs, security vulnerabilities, and
                performance issues in your code. Get AI-powered fixes in
                seconds, not hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold gradient-primary text-white hover:opacity-90 transition-opacity glow-blue"
                >
                  Start Free Review
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-800/80 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Play size={16} className="text-blue-400" />
                  See How It Works
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Code preview card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 bg-slate-100/90 dark:bg-slate-900/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-code">
                    auth.js — CodeGuard AI Review
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <Shield size={10} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400">Fixed</span>
                </div>
              </div>

              {/* Code */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60">
                <pre className="font-code text-sm leading-relaxed text-slate-700 dark:text-slate-300 overflow-x-auto">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: codeSnippet
                        .replace(
                          /\/\/ ⚠️ SQL Injection!/g,
                          '<span class="text-red-400">// ⚠️ SQL Injection!</span>'
                        )
                        .replace(
                          /\/\/ After CodeGuard AI  ✅/g,
                          '<span class="text-emerald-400">// After CodeGuard AI  ✅</span>'
                        )
                        .replace(
                          /\/\/ Parameterized & safe/g,
                          '<span class="text-emerald-400">// Parameterized & safe</span>'
                        )
                        .replace(
                          /\/\/ Before CodeGuard AI/g,
                          '<span class="text-slate-500">// Before CodeGuard AI</span>'
                        ),
                    }}
                  />
                </pre>
              </div>

              {/* Analysis result bar */}
              <div className="px-5 py-4 bg-slate-100/90 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">AI Analysis Complete</span>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400">1 Critical Fixed</span>
                    <span className="text-emerald-500 dark:text-emerald-400">Score: 95/100</span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "95%" }}
                    transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              className="absolute -top-4 -right-4 glass px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <span className="text-xs font-semibold text-red-400">
                🚨 SQL Injection Detected
              </span>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 glass px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              <span className="text-xs font-semibold text-emerald-400">
                ✅ Auto-Fixed & Secured
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
