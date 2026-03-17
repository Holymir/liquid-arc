// Token metadata cache.
//
// Resolution order:
//   1. RPC-fetched value (if successful, cache and return)
//   2. In-memory cache (previous successful fetch OR pre-warmed from DB)
//   3. Known-decimals table (common non-18 tokens: USDC, WBTC, cbBTC, etc.)
//   4. Return "???" — no static name fallbacks to avoid showing wrong names

import { prisma } from "@/lib/db/prisma";

export interface TokenMeta {
  symbol: string;
  decimals: number;
}

// ── Known decimals for common tokens ────────────────────────────────────────
// Fallback when RPC decimals() fails AND cache is cold. Only tokens whose
// decimals ≠ 18 need to be listed — 18 is the default anyway.

const KNOWN_DECIMALS: Record<string, number> = {
  // Base
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": 8,  // cbBTC
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6,  // USDC (Base)
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": 6,  // DAI (Base, bridged)
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": 6,  // USDbC
  // Ethereum / common EVM
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6,  // USDC (Ethereum)
  "0xdac17f958d2ee523a2206206994597c13d831ec7": 6,  // USDT (Ethereum)
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 8,  // WBTC
  // Optimism
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 6,  // USDC (Optimism)
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607": 6,  // USDC.e (Optimism)
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": 6,  // USDT (Optimism)
  "0x68f180fcce6836688e9084f035309e29bf0a2095": 8,  // WBTC (Optimism)
};

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
 * cached successful result, then to the known-decimals table.
 *
 * @param decimalsVerified  Pass `false` when the decimals value is a default
 *   (e.g. 18) because the RPC call failed. This prevents caching an incorrect
 *   decimals value and uses the known-decimals table or cache instead.
 */
export function resolveTokenMeta(
  address: string,
  fetched: TokenMeta,
  decimalsVerified = true,
): TokenMeta {
  const cached = getCachedTokenMeta(address);

  // 1. If fetched symbol is good
  if (fetched.symbol !== "???" && fetched.symbol !== "UNKNOWN") {
    if (decimalsVerified) {
      setCachedTokenMeta(address, fetched);
      return fetched;
    }

    // Decimals not verified — prefer cached or known-decimals, never cache unverified
    const safeDecimals = cached?.decimals
      ?? KNOWN_DECIMALS[address.toLowerCase()]
      ?? fetched.decimals;
    return { symbol: fetched.symbol, decimals: safeDecimals };
  }

  // 2. Check in-memory cache (a previous successful fetch)
  if (cached) return cached;

  // 3. Symbol unknown but we may still know the correct decimals
  const knownDec = KNOWN_DECIMALS[address.toLowerCase()];
  if (knownDec !== undefined) {
    return { symbol: fetched.symbol, decimals: knownDec };
  }

  // 4. Nothing reliable — return "???"
  return fetched;
}

// ── Pre-warm cache from DB ──────────────────────────────────────────────────
// On serverless cold starts the in-memory cache is empty, so RPC failures
// always produce "???". This loads all known token symbols from the pools
// table into the cache BEFORE adapters run, so resolveTokenMeta() has a
// reliable fallback even on the very first request.

let warmPromise: Promise<void> | null = null;

export function warmTokenCacheFromDB(): Promise<void> {
  // Deduplicate concurrent calls (e.g. multiple adapters starting in parallel)
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    try {
      const pools = await prisma.pool.findMany({
        where: {
          token0Symbol: { not: null },
          token1Symbol: { not: null },
        },
        select: {
          token0Address: true,
          token0Symbol: true,
          token0Decimals: true,
          token1Address: true,
          token1Symbol: true,
          token1Decimals: true,
        },
      });

      let count = 0;
      for (const p of pools) {
        const addr0 = p.token0Address.toLowerCase();
        const addr1 = p.token1Address.toLowerCase();
        // Only set if not already in cache (don't overwrite RPC-verified data)
        if (!cache.has(addr0) && p.token0Symbol) {
          cache.set(addr0, { symbol: p.token0Symbol, decimals: p.token0Decimals ?? 18 });
          count++;
        }
        if (!cache.has(addr1) && p.token1Symbol) {
          cache.set(addr1, { symbol: p.token1Symbol, decimals: p.token1Decimals ?? 18 });
          count++;
        }
      }
      console.log(`[token-cache] Pre-warmed ${count} tokens from ${pools.length} DB pools`);
    } catch (err) {
      console.warn("[token-cache] DB pre-warm failed:", err);
    }
  })();

  return warmPromise;
}

// Keep backward compat
export function getOrDefault(address: string, fetched: TokenMeta): TokenMeta {
  return resolveTokenMeta(address, fetched);
}
