"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, GitBranch, Globe, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
  const { setUser, setTokens } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Registration failed");
        return;
      }

      setUser(data.data.user);
      setTokens(data.data.tokens);
      toast.success("Account created! Welcome to CodeGuard AI 🎉");
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
        toast.error(result.error || "OAuth registration failed");
        return;
      }

      setUser(result.data.data.user);
      setTokens(result.data.data.tokens);
      toast.success(
        `Account created via ${provider === "github" ? "GitHub" : "Google"}! Welcome 🎉`
      );
      window.location.href = "/dashboard";
    } catch {
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
            `Account created via ${provider === "github" ? "GitHub" : "Google"}! Welcome 🎉`
          );
          window.location.href = "/dashboard";
          return;
        }
      } catch {
        // ignore
      }
      toast.error("OAuth registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
        <p className="text-slate-400 text-sm">
          Start reviewing code with AI for free
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
            or register with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
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

          {/* Password strength indicators */}
          {password && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    check.valid ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  <Check
                    size={12}
                    className={check.valid ? "opacity-100" : "opacity-30"}
                  />
                  {check.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          id="register-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-70 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Free Account"
          )}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
