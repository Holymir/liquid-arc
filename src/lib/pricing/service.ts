import { getTokenPrices } from "./coingecko";
import { getJupiterPrices } from "./jupiter";
import { getDexScreenerPrice } from "./dexscreener";
import { cacheGet, cacheSet } from "@/lib/cache";

const PRICE_CACHE_TTL = 30; // seconds

/** Normalize address for cache key — preserve case for Solana (base58) */
function normalizeAddr(chainId: string, addr: string): string {
  return chainId === "solana" ? addr : addr.toLowerCase();
}

export class PricingService {
  /**
   * Fetches USD prices for a list of token addresses on a given chain.
   * Solana: Jupiter (primary) → DexScreener (fallback)
   * EVM:    CoinGecko (primary) → DexScreener (fallback)
   * Results are cached for 30 seconds in Redis (or in-memory on local dev).
   */
  async getPrices(
    chainId: string,
    tokenAddresses: string[]
  ): Promise<Map<string, number>> {
    if (tokenAddresses.length === 0) return new Map();

    // Deduplicate addresses
    const unique = [...new Set(tokenAddresses.map((a) => normalizeAddr(chainId, a)))];

    const result = new Map<string, number>();
    const uncached: string[] = [];

    // Check cache first
    const cacheChecks = await Promise.all(
      unique.map(async (addr) => {
        const key = `price:${chainId}:${addr}`;
        const cached = await cacheGet<number>(key);
        return { addr, cached };
      })
    );

    for (const { addr, cached } of cacheChecks) {
      if (cached !== undefined) {
        result.set(addr, cached);
      } else {
        uncached.push(addr);
      }
    }

    if (uncached.length === 0) return result;

    // Fetch uncached prices — use Jupiter for Solana, CoinGecko for EVM
    let prices: Map<string, number>;
    if (chainId === "solana") {
      prices = await getJupiterPrices(uncached);
    } else {
      prices = await getTokenPrices(chainId, uncached);
    }

    // Find addresses not covered by primary source
    const misses = uncached.filter((addr) => !prices.has(addr));

    if (misses.length > 0) {
      const fallbackResults = await Promise.allSettled(
        misses.map(async (addr) => {
          const price = await getDexScreenerPrice(addr);
          return { addr, price };
        })
      );

      for (const r of fallbackResults) {
        if (r.status === "fulfilled" && r.value.price !== null) {
          prices.set(r.value.addr, r.value.price);
        }
      }
    }

    // Cache and merge
    await Promise.all(
      Array.from(prices.entries()).map(async ([addr, price]) => {
        await cacheSet(`price:${chainId}:${addr}`, price, PRICE_CACHE_TTL);
        result.set(addr, price);
      })
    );

    return result;
  }
}

export const pricingService = new PricingService();
