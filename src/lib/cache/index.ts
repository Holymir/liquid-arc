/**
 * TTL cache backed by Upstash Redis when credentials are present,
 * falling back to an in-memory Map for local dev / preview builds.
 *
 * All public APIs are async so callers are consistent across both backends.
 *
 * Required env vars (set in Vercel + Railway):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from "@upstash/redis";

// ── Redis client (lazy singleton) ─────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

interface MemEntry<T> {
  value: T;
  expiresAt: number;
}

const memStore = new Map<string, MemEntry<unknown>>();

// Evict expired entries every 30 s (only runs in long-lived processes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore) {
      if (now > entry.expiresAt) memStore.delete(key);
    }
  }, 30_000);
}

const CACHE_PREFIX = "la:cache:";

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get a cached value. Returns `undefined` on miss or error.
 * Values are JSON-serialised, so Maps/Sets must be converted before storing.
 */
export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const redis = getRedis();

  if (redis) {
    try {
      const raw = await redis.get<string>(`${CACHE_PREFIX}${key}`);
      if (raw == null) return undefined;
      // Upstash may auto-parse JSON; handle both string and object
      return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
    } catch (err) {
      console.warn(`[cache] Redis get error for "${key}":`, err);
      // Fall through to memory
    }
  }

  // Memory fallback
  const entry = memStore.get(key) as MemEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Store a value with a TTL in seconds.
 * Values must be JSON-serialisable (convert Maps/Sets to plain objects first).
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis();

  if (redis) {
    try {
      await redis.set(`${CACHE_PREFIX}${key}`, JSON.stringify(value), {
        ex: ttlSeconds,
      });
      return;
    } catch (err) {
      console.warn(`[cache] Redis set error for "${key}":`, err);
      // Fall through to memory
    }
  }

  // Memory fallback
  memStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/** Delete a cache entry. */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();

  if (redis) {
    try {
      await redis.del(`${CACHE_PREFIX}${key}`);
      return;
    } catch (err) {
      console.warn(`[cache] Redis del error for "${key}":`, err);
    }
  }

  memStore.delete(key);
}

/**
 * Cache-through helper: returns cached value or calls `fetcher`, caches the result.
 * Values must be JSON-serialisable.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = await cacheGet<T>(key);
  if (existing !== undefined) return existing;

  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
