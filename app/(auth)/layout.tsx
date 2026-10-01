import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle2, Lock, Cpu, Sparkles, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Authentication — CodeGuard AI Enterprise",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080c16] flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-35 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 px-6 lg:px-12 py-6 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CodeGuard AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous Security & Code Review</p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Cluster 99.99% Operational</span>
          </div>
          <Link
            href="/"
            className="hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-white/[0.05]"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 lg:py-14">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Enterprise Value & Live Visual Widget */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles size={13} />
                <span>Zero-Trust Enterprise Static Analysis</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
                Secure your engineering pipeline with <span className="gradient-text">Autonomous AI Intelligence</span>.
              </h2>
              <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
                Empowering tier-1 engineering organizations to detect zero-days, architectural vulnerabilities, and compliance regressions on every git commit.
              </p>
            </div>

            {/* Simulated Live AI Review Visual Component */}
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl shadow-black/60 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <Terminal size={14} className="text-cyan-400" />
                  <span>auth-controller.ts:42 · Automated AI Audit</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold tracking-wide uppercase">
                  Verified Clean
                </span>
              </div>

              <div className="font-mono text-xs space-y-1.5 text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-white/[0.04]">
                <p className="text-slate-500">// Vulnerability remediated automatically:</p>
                <p className="text-red-400/80 line-through opacity-70">
                  - const user = await db.raw(`SELECT * FROM users WHERE id = ${`$`}{`{id}`}`);
                </p>
                <p className="text-emerald-400 font-medium">
                  + const user = await prisma.user.findUnique({`{ where: { id } }`});
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.06] text-center">
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Audit Score</p>
                  <p className="text-emerald-400 font-bold text-base">98.6 / 100</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Remediation</p>
                  <p className="text-cyan-400 font-bold text-base">&lt; 1.2s</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Compliance</p>
                  <p className="text-indigo-400 font-bold text-base">SOC-2 Pass</p>
                </div>
              </div>
            </div>

            {/* Enterprise Trust Badges */}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
                <span>Zero Data Retention</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-indigo-400 flex-shrink-0" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-cyan-400 flex-shrink-0" />
                <span>Multi-Model AI (Sonnet & GPT-4o)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Container Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md glass-card rounded-2xl p-7 sm:p-9 border border-white/[0.09] shadow-2xl relative">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center border-t border-white/[0.06] text-xs text-slate-500 bg-slate-950/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CodeGuard AI Inc. Enterprise Security Standards Applied.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="#" className="hover:text-white transition-colors">Privacy Shield</Link>
            <Link href="#" className="hover:text-white transition-colors">Security Overview</Link>
            <Link href="#" className="hover:text-white transition-colors">Compliance Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
