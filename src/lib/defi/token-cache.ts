// Token metadata cache with well-known token fallback.
//
// Resolution order:
//   1. In-memory cache (successful previous fetches)
//   2. Well-known tokens from chain config (never fails for popular tokens)
//   3. RPC-fetched value (may be "???" on failure)

import { EVM_CHAINS } from "@/lib/chain/evm/chains";

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

// ── Well-known token lookup (built from chain configs) ───────────────────────

// chainId → (lowercased address → TokenMeta)
const wellKnownByChain = new Map<string, Map<string, TokenMeta>>();
// global fallback: lowercased address → TokenMeta (for all chains)
const wellKnownGlobal = new Map<string, TokenMeta>();

for (const [chainId, config] of Object.entries(EVM_CHAINS)) {
  const chainMap = new Map<string, TokenMeta>();
  for (const token of config.knownTokens) {
    const meta = { symbol: token.symbol, decimals: token.decimals };
    chainMap.set(token.address.toLowerCase(), meta);
    wellKnownGlobal.set(token.address.toLowerCase(), meta);
  }
  wellKnownByChain.set(chainId, chainMap);
}

/** Look up well-known token metadata by chain (falls back to global) */
export function getWellKnownToken(address: string, chainId?: string): TokenMeta | undefined {
  const addr = address.toLowerCase();
  if (chainId) {
    const chainMap = wellKnownByChain.get(chainId);
    const found = chainMap?.get(addr);
    if (found) return found;
  }
  return wellKnownGlobal.get(addr);
}

// ── Main resolution function ─────────────────────────────────────────────────

/**
 * Resolve token metadata with fallback chain:
 *   cached → well-known → fetched value
 *
 * Caches successful results. Never caches "???".
 */
export function resolveTokenMeta(
  address: string,
  fetched: TokenMeta,
  chainId?: string
): TokenMeta {
  // 1. If fetched is good, cache and return it
  if (fetched.symbol !== "???" && fetched.symbol !== "UNKNOWN") {
    setCachedTokenMeta(address, fetched);
    return fetched;
  }

  // 2. Check in-memory cache
  const cached = getCachedTokenMeta(address);
  if (cached) return cached;

  // 3. Check well-known tokens
  const wellKnown = getWellKnownToken(address, chainId);
  if (wellKnown) {
    setCachedTokenMeta(address, wellKnown);
    return wellKnown;
  }

  // 4. Return the "???" fallback
  return fetched;
}

// Keep backward compat
export function getOrDefault(address: string, fetched: TokenMeta): TokenMeta {
  return resolveTokenMeta(address, fetched);
}
