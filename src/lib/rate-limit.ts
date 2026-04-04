/**
 * Rate limiter backed by Upstash Redis (sliding window).
 *
 * Falls back to an in-memory sliding-window implementation when
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set —
 * useful for local dev and preview deployments, but NOT safe for
 * multi-instance production (each instance has its own counter).
 *
 * Set the env vars in Vercel → Settings → Environment Variables:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ── Preset configs ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  auth:   { limit: 5,  windowSeconds: 60 },  // 5 req/min  — login / register
  api:    { limit: 30, windowSeconds: 60 },  // 30 req/min — authenticated APIs
  public: { limit: 60, windowSeconds: 60 },  // 60 req/min — public endpoints
  market: { limit: 20, windowSeconds: 60 },  // 20 req/min — market/CoinGecko proxy
} as const;

// ── Upstash Redis limiter (production) ────────────────────────────────────────

function makeUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
    analytics: false,
    prefix: "la:rl",
  });
}

// Cache limiter instances keyed by "limit:window" to avoid recreating per request
const upstashLimiters = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.limit}:${config.windowSeconds}`;
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(key, makeUpstashLimiter(config));
  }
  return upstashLimiters.get(key)!;
}

// ── In-memory fallback (dev / local) ─────────────────────────────────────────

interface MemEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, MemEntry>();

// Periodic cleanup — only runs in long-lived Node processes (not on edge/CF)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (now > v.resetAt) memStore.delete(k);
    }
  }, 60_000);
}

function checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memStore.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Check whether `key` is within the rate limit defined by `config`.
 * Uses Upstash Redis when credentials are present, in-memory otherwise.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!hasUpstash) {
    return checkMemory(key, config);
  }

  try {
    const limiter = getLimiter(config);
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      allowed: success,
      remaining,
      resetAt: reset,
    };
  } catch (err) {
    // If Redis is temporarily unavailable, fail open (allow the request)
    // and log the error so we can alert on it.
    console.error("[rate-limit] Upstash error — failing open:", err);
    return { allowed: true, remaining: config.limit, resetAt: Date.now() + config.windowSeconds * 1000 };
  }
}
