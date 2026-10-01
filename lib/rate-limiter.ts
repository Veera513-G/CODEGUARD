import { redis } from "./redis";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export async function rateLimit(
  identifier: string,
  maxRequests = parseInt(process.env.RATE_LIMIT_MAX || "100"),
  windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000")
): Promise<RateLimitResult> {
  const windowSeconds = Math.floor(windowMs / 1000);
  const key = `rate_limit:${identifier}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + ttl * 1000;
    const remaining = Math.max(0, maxRequests - current);

    return {
      success: current <= maxRequests,
      remaining,
      resetTime,
    };
  } catch {
    // If Redis fails, allow the request
    return { success: true, remaining: maxRequests, resetTime: 0 };
  }
}

// Auth-specific rate limit: stricter (5 attempts per 15 min)
export async function authRateLimit(ip: string): Promise<RateLimitResult> {
  return rateLimit(`auth:${ip}`, 5, 15 * 60 * 1000);
}

// Review rate limit based on subscription
export async function reviewRateLimit(
  userId: string,
  plan: string
): Promise<RateLimitResult> {
  const limits: Record<string, number> = {
    FREE: 20,
    PRO: 500,
    ENTERPRISE: 999999,
  };
  const limit = limits[plan] || 20;
  return rateLimit(`review:${userId}`, limit, 30 * 24 * 60 * 60 * 1000); // Monthly
}
