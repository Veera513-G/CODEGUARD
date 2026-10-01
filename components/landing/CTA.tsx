"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-12 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--cta-from) 0%, var(--cta-mid) 50%, var(--cta-to) 100%)",
            border: "1px solid var(--cta-border)",
          }}
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Sparkles size={14} />
              Start for free today
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Ship better code{" "}
              <span className="gradient-text">every day</span>
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of developers who use CodeGuard AI to catch bugs
              before they reach production. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                Start Free Review
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Sign In
              </Link>
            </div>

            <p className="text-slate-500 text-sm mt-6">
              20 free scans/month · No credit card · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
