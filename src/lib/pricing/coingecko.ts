// CoinGecko price client with 60-second in-memory cache

const COINGECKO_PLATFORM: Record<string, string> = {
  base: "base",
  ethereum: "ethereum",
  arbitrum: "arbitrum-one",
  polygon: "polygon-pos",
  optimism: "optimistic-ethereum",
  bsc: "binance-smart-chain",
  avalanche: "avalanche",
  solana: "solana",
};

interface CacheEntry {
  prices: Map<string, number>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export async function getTokenPrices(
  chainId: string,
  addresses: string[]
): Promise<Map<string, number>> {
  if (addresses.length === 0) return new Map();

  const platform = COINGECKO_PLATFORM[chainId];
  if (!platform) return new Map();

  const cacheKey = `${chainId}:${addresses
    .map((a) => a.toLowerCase())
    .sort()
    .join(",")}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.prices;
  }

  const apiUrl = process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
  const apiKey = process.env.COINGECKO_API_KEY;

  const params = new URLSearchParams({
    contract_addresses: addresses.join(","),
    vs_currencies: "usd",
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  const response = await fetch(
    `${apiUrl}/simple/token_price/${platform}?${params}`,
    { headers, next: { revalidate: 0 } }
  );

  if (!response.ok) {
    // Batch request failed (free tier limits to 1 address per request).
    // Fall back to individual per-address requests.
    if (addresses.length > 1) {
      return getTokenPricesIndividually(platform, addresses, apiUrl, apiKey);
    }
    return new Map();
  }

  const data = (await response.json()) as Record<
    string,
    { usd?: number }
  >;

  const prices = new Map<string, number>();
  for (const [addr, priceData] of Object.entries(data)) {
    if (priceData.usd !== undefined) {
      prices.set(addr.toLowerCase(), priceData.usd);
    }
  }

  cache.set(cacheKey, { prices, expiresAt: Date.now() + CACHE_TTL_MS });
  return prices;
}

/**
 * Fetch prices one address at a time — used when CoinGecko's batch endpoint
 * rejects multi-address requests (free tier: 1 address per request).
 */
async function getTokenPricesIndividually(
  platform: string,
  addresses: string[],
  apiUrl: string,
  apiKey?: string,
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

  const results = await Promise.allSettled(
    addresses.map(async (addr) => {
      const params = new URLSearchParams({
        contract_addresses: addr,
        vs_currencies: "usd",
      });

      const res = await fetch(
        `${apiUrl}/simple/token_price/${platform}?${params}`,
        { headers, next: { revalidate: 0 } },
      );
      if (!res.ok) return;

      const data = (await res.json()) as Record<string, { usd?: number }>;
      for (const [a, priceData] of Object.entries(data)) {
        if (priceData.usd !== undefined) {
          prices.set(a.toLowerCase(), priceData.usd);
        }
      }
    }),
  );

  // Log failures for debugging
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.warn(`[coingecko] ${failures.length}/${addresses.length} individual price fetches failed`);
  }

  return prices;
}
