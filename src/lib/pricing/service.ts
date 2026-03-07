import { getTokenPrices } from "./coingecko";
import { getDexScreenerPrice } from "./dexscreener";

export class PricingService {
  /**
   * Fetches USD prices for a list of token addresses on a given chain.
   * Primary source: CoinGecko. Falls back to DexScreener for misses.
   */
  async getPrices(
    chainId: string,
    tokenAddresses: string[]
  ): Promise<Map<string, number>> {
    if (tokenAddresses.length === 0) return new Map();

    const prices = await getTokenPrices(chainId, tokenAddresses);

    // Find addresses not covered by CoinGecko
    const misses = tokenAddresses.filter(
      (addr) => !prices.has(addr.toLowerCase())
    );

    if (misses.length > 0) {
      const fallbackResults = await Promise.allSettled(
        misses.map(async (addr) => {
          const price = await getDexScreenerPrice(addr);
          return { addr: addr.toLowerCase(), price };
        })
      );

      for (const result of fallbackResults) {
        if (result.status === "fulfilled" && result.value.price !== null) {
          prices.set(result.value.addr, result.value.price);
        }
      }
    }

    return prices;
  }
}

export const pricingService = new PricingService();
