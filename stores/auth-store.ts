"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "@/types/user";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loginAt: number | null; // timestamp when tokens were last set
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      loginAt: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setTokens: (tokens) =>
        set({ tokens, loginAt: tokens ? Date.now() : null }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set({ user: null, tokens: null, loginAt: null });
        // Clear any auth cookies
        document.cookie =
          "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      },

      isAuthenticated: () => {
        const { user, tokens, loginAt } = get();
        if (!user || !tokens || !loginAt) return false;
        // Check if access token is still valid
        const expiresAt = loginAt + tokens.expiresIn;
        return expiresAt > Date.now();
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
      },
    }),
    {
      name: "codeguard-auth",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        loginAt: state.loginAt,
      }),
    }
  )
);

