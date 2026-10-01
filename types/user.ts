export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type AuthProvider = "EMAIL" | "GOOGLE" | "GITHUB";
export type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified: boolean;
  provider: AuthProvider;
  bio?: string;
  website?: string;
  company?: string;
  createdAt: string;
  subscription?: {
    plan: SubscriptionPlan;
    status: string;
    scansUsed: number;
    scansLimit: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
