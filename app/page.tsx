import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "CodeGuard AI — AI-Powered Code Review Assistant",
  description:
    "Detect bugs, security vulnerabilities, and performance issues in your code automatically with AI. Get actionable fixes in seconds.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-50/80 dark:bg-[#0a0f1e]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg glow-blue">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">CodeGuard AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
            >
              Features
            </Link>
            <Link
              href="#"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
            >
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
