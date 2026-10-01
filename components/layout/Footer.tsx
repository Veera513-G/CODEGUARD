"use client";

import Link from "next/link";
import { Shield, GitBranch, ExternalLink } from "lucide-react";
// Social icons using available lucide alternatives
const Github = GitBranch;
const Twitter = ExternalLink;
const Linkedin = ExternalLink;

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-slate-50/50 dark:bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">CodeGuard AI</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              AI-powered code review for modern development teams.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {["Features", "Changelog", "Roadmap"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} CodeGuard AI. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">
            Built with ❤️ for developers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
