// Historical token prices from CoinGecko
//
// Used to get token prices at a specific past timestamp (e.g., position entry time).
// Results are cached permanently since historical prices never change.

const COINGECKO_PLATFORM: Record<string, string> = {
  base: "base",
  ethereum: "ethereum",
  arbitrum: "arbitrum-one",
};

// Permanent cache: historical prices never change
const historyCache = new Map<string, number>();

function cacheKey(chainId: string, address: string, timestamp: number): string {
  // Round to nearest hour to improve cache hits
  const hourTs = Math.floor(timestamp / 3600) * 3600;
  return `${chainId}:${address.toLowerCase()}:${hourTs}`;
}

/**
 * Get the USD price of a token at a specific timestamp.
 * Uses CoinGecko's market_chart/range endpoint.
 * Returns null if price cannot be determined.
 */
export async function getHistoricalPrice(
  chainId: string,
  tokenAddress: string,
  timestamp: number // unix seconds
): Promise<number | null> {
  const key = cacheKey(chainId, tokenAddress, timestamp);
  const cached = historyCache.get(key);
  if (cached !== undefined) return cached;

  const platform = COINGECKO_PLATFORM[chainId];
  if (!platform) return null;

  const apiUrl = process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
  const apiKey = process.env.COINGECKO_API_KEY;

  // Query a 2-hour window around the target timestamp
  const from = timestamp - 3600;
  const to = timestamp + 3600;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

  try {
    const res = await fetch(
      `${apiUrl}/coins/${platform}/contract/${tokenAddress.toLowerCase()}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`,
      { headers }
    );

    if (!res.ok) {
      console.warn(`[pricing] Historical price fetch failed for ${tokenAddress}: ${res.status}`);
      return null;
    }

    const data = await res.json() as { prices?: [number, number][] };
    const prices = data.prices;
    if (!prices || prices.length === 0) return null;

    // Find the closest price point to our target timestamp
    const targetMs = timestamp * 1000;
    let closest = prices[0];
    let minDiff = Math.abs(prices[0][0] - targetMs);

    for (const point of prices) {
      const diff = Math.abs(point[0] - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    const price = closest[1];
    historyCache.set(key, price);
    return price;
  } catch (err) {
    console.warn(
      `[pricing] Historical price error for ${tokenAddress}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Get historical prices for a pair of tokens at the same timestamp.
 * Makes requests in parallel.
 */
export async function getHistoricalPricePair(
  chainId: string,
  token0Address: string,
  token1Address: string,
  timestamp: number
): Promise<{ price0: number | null; price1: number | null }> {
  const [price0, price1] = await Promise.all([
    getHistoricalPrice(chainId, token0Address, timestamp),
    getHistoricalPrice(chainId, token1Address, timestamp),
  ]);
  return { price0, price1 };
}
