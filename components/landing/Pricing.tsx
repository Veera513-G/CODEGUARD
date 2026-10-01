"use client";

import { motion } from "framer-motion";
import { Check, Zap, Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    price: "$0",
    period: "forever",
    description: "Perfect for individual developers exploring AI code review.",
    color: "border-slate-200 dark:border-slate-700",
    buttonClass: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700",
    features: [
      "20 scans per month",
      "Basic bug detection",
      "Security scanning",
      "5 supported languages",
      "7-day history",
      "Community support",
    ],
    notIncluded: [
      "Repository scanning",
      "Team workspaces",
      "PDF reports",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    icon: Zap,
    price: "$29",
    period: "per month",
    description: "For professional developers and small teams.",
    color: "border-blue-500/50",
    highlight: true,
    badge: "Most Popular",
    buttonClass: "gradient-primary hover:opacity-90 text-white",
    features: [
      "Unlimited scans",
      "Advanced AI analysis",
      "All 10 languages",
      "Repository scanning",
      "GitHub integration",
      "Team workspace (5 seats)",
      "PDF & security reports",
      "90-day history",
      "Priority support",
    ],
    notIncluded: ["Custom AI models", "SSO", "Dedicated support"],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "contact us",
    description: "For large teams and organizations needing full control.",
    color: "border-purple-500/30",
    buttonClass: "bg-purple-600 hover:bg-purple-500 text-white",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "Custom AI models",
      "Advanced analytics",
      "SSO / SAML",
      "Audit logs",
      "Custom integrations",
      "Unlimited history",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Start free, scale{" "}
            <span className="gradient-text">as you grow</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. All plans include core AI analysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={cn(
                "relative flex flex-col p-8 rounded-2xl border bg-gradient-to-b from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-950/80",
                plan.color,
                plan.highlight && "ring-1 ring-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.08)] dark:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 dark:text-blue-400">
                    <plan.icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{plan.description}</p>
              </div>

              <Link
                href="/register"
                className={cn(
                  "w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all duration-200 mb-8",
                  plan.buttonClass
                )}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Link>

              <div className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
