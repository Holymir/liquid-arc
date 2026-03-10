import { getTokenPrices } from "./coingecko";
import { getDexScreenerPrice } from "./dexscreener";
import { cacheGet, cacheSet } from "@/lib/cache";

const PRICE_CACHE_TTL = 30; // seconds

export class PricingService {
  /**
   * Fetches USD prices for a list of token addresses on a given chain.
   * Primary source: CoinGecko. Falls back to DexScreener for misses.
   * Results are cached for 30 seconds.
   */
  async getPrices(
    chainId: string,
    tokenAddresses: string[]
  ): Promise<Map<string, number>> {
    if (tokenAddresses.length === 0) return new Map();

    const result = new Map<string, number>();
    const uncached: string[] = [];

    // Check cache first
    for (const addr of tokenAddresses) {
      const key = `price:${chainId}:${addr.toLowerCase()}`;
      const cached = cacheGet<number>(key);
      if (cached !== undefined) {
        result.set(addr.toLowerCase(), cached);
      } else {
        uncached.push(addr);
      }
    }

    if (uncached.length === 0) return result;

    // Fetch uncached prices
    const prices = await getTokenPrices(chainId, uncached);

    // Find addresses not covered by CoinGecko
    const misses = uncached.filter(
      (addr) => !prices.has(addr.toLowerCase())
    );

    if (misses.length > 0) {
      const fallbackResults = await Promise.allSettled(
        misses.map(async (addr) => {
          const price = await getDexScreenerPrice(addr);
          return { addr: addr.toLowerCase(), price };
        })
      );

      for (const r of fallbackResults) {
        if (r.status === "fulfilled" && r.value.price !== null) {
          prices.set(r.value.addr, r.value.price);
        }
      }
    }

    // Cache and merge
    for (const [addr, price] of prices) {
      cacheSet(`price:${chainId}:${addr}`, price, PRICE_CACHE_TTL);
      result.set(addr, price);
    }

    return result;
  }
}

export const pricingService = new PricingService();
