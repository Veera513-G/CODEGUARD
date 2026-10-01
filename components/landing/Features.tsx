"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Bug, BarChart3, Code2, Lock } from "lucide-react";

const features = [
  {
    icon: Bug,
    title: "AI Bug Detection",
    description:
      "Catch logical errors, null pointer risks, memory leaks, and infinite loops before they reach production.",
    color: "from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/5",
    iconColor: "text-red-500 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-500/20",
  },
  {
    icon: Shield,
    title: "Security Analysis",
    description:
      "Detect SQL injection, XSS, CSRF, authentication flaws, and hardcoded secrets with OWASP-aligned scanning.",
    color: "from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/5",
    iconColor: "text-orange-500 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-500/20",
  },
  {
    icon: Zap,
    title: "Performance Optimizer",
    description:
      "Identify slow loops, inefficient queries, memory hotspots, and CPU-intensive operations automatically.",
    color: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/5",
    iconColor: "text-blue-500 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-500/20",
  },
  {
    icon: BarChart3,
    title: "Quality Scoring",
    description:
      "Get comprehensive scores for readability, maintainability, complexity, and coding standards compliance.",
    color: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/5",
    iconColor: "text-purple-500 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-500/20",
  },
  {
    icon: Code2,
    title: "10 Languages",
    description:
      "Full support for JavaScript, TypeScript, Python, Java, C/C++, C#, PHP, Go, and Rust.",
    color: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/5",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-500/20",
  },
  {
    icon: Lock,
    title: "Best Practices",
    description:
      "Enforce SOLID principles, clean architecture, design patterns, and framework-specific standards.",
    color: "from-cyan-500/10 to-cyan-600/5 dark:from-cyan-500/20 dark:to-cyan-600/5",
    iconColor: "text-cyan-500 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-500/20",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 mb-4">
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need for{" "}
            <span className="gradient-text">code excellence</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            CodeGuard AI analyzes your code across five dimensions to give you
            actionable, prioritized improvements.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className={`relative p-6 rounded-2xl border ${feature.borderColor} bg-gradient-to-br ${feature.color} bg-white dark:bg-transparent card-hover group cursor-default`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
