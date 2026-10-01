"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const PROTECTED_ROUTE_PREFIX = ["/dashboard", "/reviews", "/repositories", "/teams", "/reports", "/analytics", "/notifications", "/settings"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// How early before expiry to trigger refresh (2 minutes before expiry)
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tokens, setUser, setTokens, setLoading, logout } = useAuthStore();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  // Refresh tokens silently
  const refreshSession = useCallback(async () => {
    if (isRefreshingRef.current) return;
    if (!tokens?.refreshToken) return;

    isRefreshingRef.current = true;

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.data.user);
        setTokens(data.data.tokens);
      } else {
        // Refresh failed — force logout
        logout();
        router.push("/login");
      }
    } catch {
      // Network error — don't force logout, retry later
      console.warn("[AuthProvider] Token refresh failed, will retry");
    } finally {
      isRefreshingRef.current = false;
    }
  }, [tokens?.refreshToken, setUser, setTokens, logout, router]);

  // Schedule token refresh before expiry
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!tokens?.expiresIn || !tokens.refreshToken) return;

    // Calculate how long until we need to refresh
    // expiresIn is the TTL in ms from when the token was issued
    const refreshIn = Math.max(tokens.expiresIn - REFRESH_BUFFER_MS, 30_000);

    refreshTimerRef.current = setTimeout(() => {
      refreshSession();
    }, refreshIn);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [tokens?.expiresIn, tokens?.refreshToken, refreshSession]);

  // On mount: check auth state and redirect if needed
  useEffect(() => {
    const isProtected = PROTECTED_ROUTE_PREFIX.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    const isAuthRoute = AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Wait for Zustand hydration
    const timeout = setTimeout(() => {
      setLoading(false);

      // If on a protected route without auth, redirect to login
      if (isProtected && !user) {
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
        return;
      }

      // If authenticated user visits auth page, redirect to dashboard
      if (isAuthRoute && user) {
        router.push("/dashboard");
        return;
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname, user, setLoading, router]);

  // Listen for storage events (multi-tab logout sync)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "codeguard-auth") {
        try {
          const newState = e.newValue ? JSON.parse(e.newValue) : null;
          if (!newState?.state?.user) {
            // User logged out in another tab
            logout();
            router.push("/login");
          } else {
            // User logged in or refreshed in another tab
            setUser(newState.state.user);
            setTokens(newState.state.tokens);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout, setUser, setTokens, router]);

  return <>{children}</>;
}
