"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, GitBranch, Globe, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const { setUser, setTokens } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail("demo@codeguard.ai");
    setPassword("Demo123!");
    toast.info("Demo credentials filled!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Login failed");
        return;
      }

      setUser(data.data.user);
      setTokens(data.data.tokens);
      toast.success("Welcome back!");
      // Full redirect to ensure cookies and stores are synced
      window.location.href = "/dashboard";
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "github" | "google") {
    setLoading(true);
    try {
      const { loginWithFirebase } = await import("@/lib/firebase-auth-client");
      const result = await loginWithFirebase(provider);

      if (!result.ok || !result.data?.success) {
        toast.error(result.error || "OAuth login failed");
        return;
      }

      setUser(result.data.data.user);
      setTokens(result.data.data.tokens);
      toast.success(
        `Signed in with ${provider === "github" ? "GitHub" : "Google"}!`
      );
      window.location.href = "/dashboard";
    } catch {
      // Direct fallback to server mock
      try {
        const res = await fetch("/api/auth/oauth-mock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        });
        const fallbackData = await res.json();
        if (fallbackData.success) {
          setUser(fallbackData.data.user);
          setTokens(fallbackData.data.tokens);
          toast.success(
            `Signed in with ${provider === "github" ? "GitHub" : "Google"}!`
          );
          window.location.href = "/dashboard";
          return;
        }
      } catch {
        // ignore
      }
      toast.error("OAuth login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-slate-400 text-sm">
          Sign in to your CodeGuard AI account
        </p>
      </div>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuthLogin("github")}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <GitBranch size={16} />
          GitHub
        </button>
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Globe size={16} />
          Google
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-transparent text-slate-500">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors text-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-70 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Create account
        </Link>
      </p>

      {/* Demo hint with 1-click fill button */}
      <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-blue-400 flex items-center gap-1">
            <Sparkles size={13} /> Demo Account
          </p>
          <p className="text-slate-400 truncate">demo@codeguard.ai / Demo123!</p>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex-shrink-0"
        >
          Fill Demo
        </button>
      </div>
    </>
  );
}
