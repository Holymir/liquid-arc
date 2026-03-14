// Token metadata cache.
//
// Resolution order:
//   1. RPC-fetched value (if successful, cache and return)
//   2. In-memory cache (previous successful fetch, used if current RPC fails)
//   3. Return "???" — no static name fallbacks to avoid showing wrong names

interface TokenMeta {
  symbol: string;
  decimals: number;
}

// ── In-memory cache ──────────────────────────────────────────────────────────

const cache = new Map<string, TokenMeta>();

export function getCachedTokenMeta(address: string): TokenMeta | undefined {
  return cache.get(address.toLowerCase());
}

export function setCachedTokenMeta(address: string, meta: TokenMeta): void {
  if (meta.symbol === "???" || meta.symbol === "UNKNOWN") return;
  cache.set(address.toLowerCase(), meta);
}

// ── Main resolution function ─────────────────────────────────────────────────

/**
 * Resolve token metadata from a fresh RPC fetch, falling back to a previously
 * cached successful result. Never falls back to a static name list.
 *
 * @param decimalsVerified  Pass `false` when the decimals value is a default
 *   (e.g. 18) because the RPC call failed. This prevents caching an incorrect
 *   decimals value and prefers a previously-cached value when available.
 */
export function resolveTokenMeta(
  address: string,
  fetched: TokenMeta,
  decimalsVerified = true,
): TokenMeta {
  const cached = getCachedTokenMeta(address);

  // 1. If fetched symbol is good
  if (fetched.symbol !== "???" && fetched.symbol !== "UNKNOWN") {
    if (!decimalsVerified && cached) {
      // Decimals defaulted — keep the cached (verified) decimals value
      const merged = { symbol: fetched.symbol, decimals: cached.decimals };
      setCachedTokenMeta(address, merged);
      return merged;
    }
    setCachedTokenMeta(address, fetched);
    return fetched;
  }

  // 2. Check in-memory cache (a previous successful fetch)
  if (cached) return cached;

  // 3. Nothing reliable — return "???"
  return fetched;
}

// Keep backward compat
export function getOrDefault(address: string, fetched: TokenMeta): TokenMeta {
  return resolveTokenMeta(address, fetched);
}
