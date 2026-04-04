// CoinGecko market data client with Redis-backed cache (in-memory fallback on local dev)

import { cacheGet, cacheSet } from "@/lib/cache";
import type {
  CoinMarketData,
  TrendingCoin,
  CoinDetail,
  ChartPoint,
  MarketCategory,
  GlobalMarketData,
  FearGreedData,
  TopMover,
} from "./types";

// Cache helpers wrap the shared Redis/memory cache
async function getCached<T>(key: string): Promise<T | undefined> {
  return cacheGet<T>(`market:${key}`);
}

async function setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  return cacheSet<T>(`market:${key}`, data, ttlSeconds);
}

/**
 * CoinGecko request queue — serializes requests with minimal gap to avoid 429s
 * while allowing cache hits to bypass the queue entirely.
 */
let requestQueue: Promise<void> = Promise.resolve();
const MIN_GAP_MS = 400; // 400ms between actual API calls (safe for free tier)

async function fetchCoinGecko<T>(path: string): Promise<T | null> {
  const apiUrl =
    process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
  const apiKey = process.env.COINGECKO_API_KEY;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  // Queue requests so they don't fire simultaneously
  const result = new Promise<T | null>((resolve) => {
    requestQueue = requestQueue.then(async () => {
      try {
        const response = await fetch(`${apiUrl}${path}`, {
          headers,
          next: { revalidate: 0 },
        });

        if (response.status === 429) {
          console.warn(`[coingecko-market] 429 on ${path}, waiting 3s`);
          await new Promise((r) => setTimeout(r, 3000));
          const retry = await fetch(`${apiUrl}${path}`, {
            headers,
            next: { revalidate: 0 },
          });
          if (!retry.ok) {
            resolve(null);
            return;
          }
          resolve((await retry.json()) as T);
          await new Promise((r) => setTimeout(r, MIN_GAP_MS));
          return;
        }

        if (!response.ok) {
          console.error(`[coingecko-market] ${path} → ${response.status}`);
          resolve(null);
          await new Promise((r) => setTimeout(r, MIN_GAP_MS));
          return;
        }

        resolve((await response.json()) as T);
        await new Promise((r) => setTimeout(r, MIN_GAP_MS));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[coingecko-market] ${path}:`, msg);
        resolve(null);
      }
    });
  });

  return result;
}

// ---------------------------------------------------------------------------
// getTopCoins
// ---------------------------------------------------------------------------

export async function getTopCoins(
  page = 1,
  perPage = 100,
  category?: string
): Promise<CoinMarketData[]> {
  const cacheKey = `top-coins:${page}:${perPage}:${category ?? "all"}`;
  const cached = await getCached<CoinMarketData[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "7d",
  });
  if (category) {
    params.set("category", category);
  }

  const raw = await fetchCoinGecko<Record<string, unknown>[]>(
    `/coins/markets?${params}`
  );
  if (!raw) return [];

  const coins: CoinMarketData[] = raw.map((c) => ({
    id: String(c.id ?? ""),
    symbol: String(c.symbol ?? ""),
    name: String(c.name ?? ""),
    image: String(c.image ?? ""),
    currentPrice: Number(c.current_price ?? 0),
    marketCap: Number(c.market_cap ?? 0),
    marketCapRank: Number(c.market_cap_rank ?? 0),
    totalVolume: Number(c.total_volume ?? 0),
    priceChange24h: Number(c.price_change_24h ?? 0),
    priceChangePercentage24h: Number(c.price_change_percentage_24h ?? 0),
    priceChangePercentage7d: Number(
      c.price_change_percentage_7d_in_currency ?? 0
    ),
    sparklineIn7d: Array.isArray(
      (c.sparkline_in_7d as Record<string, unknown>)?.price
    )
      ? ((c.sparkline_in_7d as Record<string, unknown>).price as number[])
      : [],
    ath: Number(c.ath ?? 0),
    athChangePercentage: Number(c.ath_change_percentage ?? 0),
  }));

  await setCache(cacheKey, coins, 120);
  return coins;
}

// ---------------------------------------------------------------------------
// getTrendingCoins
// ---------------------------------------------------------------------------

export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  const cacheKey = "trending-coins";
  const cached = await getCached<TrendingCoin[]>(cacheKey);
  if (cached) return cached;

  const raw = await fetchCoinGecko<{
    coins: { item: Record<string, unknown> }[];
  }>("/search/trending");
  if (!raw?.coins) return [];

  const coins: TrendingCoin[] = raw.coins.map(({ item }) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    symbol: String(item.symbol ?? ""),
    marketCapRank: Number(item.market_cap_rank ?? 0),
    thumb: String(item.thumb ?? ""),
    priceChange24h: Number(
      (item.data as Record<string, unknown>)?.price_change_percentage_24h ??
        (item as Record<string, unknown>).price_change_percentage_24h ??
        0
    ),
    price: Number(
      (item.data as Record<string, unknown>)?.price ??
        (item as Record<string, unknown>).price_btc ??
        0
    ),
  }));

  await setCache(cacheKey, coins, 300);
  return coins;
}

// ---------------------------------------------------------------------------
// getCoinDetail
// ---------------------------------------------------------------------------

export async function getCoinDetail(
  coinId: string
): Promise<CoinDetail | null> {
  const cacheKey = `coin-detail:${coinId}`;
  const cached = await getCached<CoinDetail>(cacheKey);
  if (cached) return cached;

  const raw = await fetchCoinGecko<Record<string, unknown>>(
    `/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  );
  if (!raw) return null;

  const md = (raw.market_data ?? {}) as Record<string, unknown>;
  const img = (raw.image ?? {}) as Record<string, string>;
  const desc = (raw.description ?? {}) as Record<string, string>;
  const rawLinks = (raw.links ?? {}) as Record<string, unknown>;

  const coin: CoinDetail = {
    id: String(raw.id ?? ""),
    symbol: String(raw.symbol ?? ""),
    name: String(raw.name ?? ""),
    image: {
      large: String(img.large ?? ""),
      small: String(img.small ?? ""),
      thumb: String(img.thumb ?? ""),
    },
    description: String(desc.en ?? ""),
    links: {
      homepage: Array.isArray(rawLinks.homepage)
        ? (rawLinks.homepage as string[]).filter(Boolean)
        : [],
      twitter: String(
        (rawLinks as Record<string, string>).twitter_screen_name ?? ""
      ),
      telegram: String(
        (rawLinks as Record<string, string>).telegram_channel_identifier ?? ""
      ),
    },
    categories: Array.isArray(raw.categories)
      ? (raw.categories as string[]).filter(Boolean)
      : [],
    marketData: {
      currentPrice: Number(
        (md.current_price as Record<string, number>)?.usd ?? 0
      ),
      marketCap: Number(
        (md.market_cap as Record<string, number>)?.usd ?? 0
      ),
      totalVolume: Number(
        (md.total_volume as Record<string, number>)?.usd ?? 0
      ),
      priceChange24h: Number(md.price_change_24h ?? 0),
      priceChangePercentage24h: Number(
        md.price_change_percentage_24h ?? 0
      ),
      priceChangePercentage7d: Number(
        md.price_change_percentage_7d ?? 0
      ),
      priceChangePercentage30d: Number(
        md.price_change_percentage_30d ?? 0
      ),
      circulatingSupply: Number(md.circulating_supply ?? 0),
      totalSupply: md.total_supply != null ? Number(md.total_supply) : null,
      maxSupply: md.max_supply != null ? Number(md.max_supply) : null,
      ath: Number((md.ath as Record<string, number>)?.usd ?? 0),
      athDate: String(
        (md.ath_date as Record<string, string>)?.usd ?? ""
      ),
      atl: Number((md.atl as Record<string, number>)?.usd ?? 0),
      atlDate: String(
        (md.atl_date as Record<string, string>)?.usd ?? ""
      ),
    },
  };

  await setCache(cacheKey, coin, 300);
  return coin;
}

// ---------------------------------------------------------------------------
// getCoinChart
// ---------------------------------------------------------------------------

export async function getCoinChart(
  coinId: string,
  days: number
): Promise<ChartPoint[]> {
  const cacheKey = `coin-chart:${coinId}:${days}`;
  const cached = await getCached<ChartPoint[]>(cacheKey);
  if (cached) return cached;

  const raw = await fetchCoinGecko<{ prices: [number, number][] }>(
    `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );
  if (!raw?.prices) return [];

  const chart: ChartPoint[] = raw.prices.map(([timestamp, price]) => ({
    timestamp,
    price,
  }));

  await setCache(cacheKey, chart, 300);
  return chart;
}

// ---------------------------------------------------------------------------
// getMarketCategories
// ---------------------------------------------------------------------------

export async function getMarketCategories(): Promise<MarketCategory[]> {
  const cacheKey = "market-categories";
  const cached = await getCached<MarketCategory[]>(cacheKey);
  if (cached) return cached;

  const raw = await fetchCoinGecko<Record<string, unknown>[]>(
    "/coins/categories"
  );
  if (!raw) return [];

  const categories: MarketCategory[] = raw.map((c) => ({
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    marketCap: Number(c.market_cap ?? 0),
    marketCapChange24h: Number(c.market_cap_change_24h ?? 0),
    volume24h: Number(c.volume_24h ?? 0),
    top3Coins: Array.isArray(c.top_3_coins)
      ? (c.top_3_coins as string[])
      : [],
  }));

  await setCache(cacheKey, categories, 1800);
  return categories;
}

// ---------------------------------------------------------------------------
// getGlobalMarketData
// ---------------------------------------------------------------------------

export async function getGlobalMarketData(): Promise<GlobalMarketData | null> {
  const cacheKey = "global-market-data";
  const cached = await getCached<GlobalMarketData>(cacheKey);
  if (cached) return cached;

  const raw = await fetchCoinGecko<{
    data: Record<string, unknown>;
  }>("/global");
  if (!raw?.data) return null;

  const d = raw.data;
  const globalData: GlobalMarketData = {
    totalMarketCap: Number(
      (d.total_market_cap as Record<string, number>)?.usd ?? 0
    ),
    totalVolume: Number(
      (d.total_volume as Record<string, number>)?.usd ?? 0
    ),
    btcDominance: Number(
      (d.market_cap_percentage as Record<string, number>)?.btc ?? 0
    ),
    ethDominance: Number(
      (d.market_cap_percentage as Record<string, number>)?.eth ?? 0
    ),
    marketCapChange24h: Number(
      d.market_cap_change_percentage_24h_usd ?? 0
    ),
    activeCryptocurrencies: Number(d.active_cryptocurrencies ?? 0),
  };

  await setCache(cacheKey, globalData, 120);
  return globalData;
}

// ---------------------------------------------------------------------------
// getFearGreedIndex
// ---------------------------------------------------------------------------

export async function getFearGreedIndex(): Promise<FearGreedData | null> {
  const cacheKey = "fear-greed-index";
  const cached = await getCached<FearGreedData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      "https://api.alternative.me/fng/?limit=2&format=json",
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      console.error(
        `[coingecko-market] fear-greed returned ${response.status}`
      );
      return null;
    }

    const raw = (await response.json()) as {
      data: { value: string; value_classification: string; timestamp: string }[];
    };

    if (!raw?.data?.length) return null;

    const current = raw.data[0];
    const previous = raw.data[1];

    const fearGreed: FearGreedData = {
      value: Number(current.value),
      classification: current.value_classification,
      timestamp: Number(current.timestamp),
      previousClose: previous ? Number(previous.value) : Number(current.value),
    };

    await setCache(cacheKey, fearGreed, 300);
    return fearGreed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[coingecko-market] fear-greed fetch error:", message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// getTopGainers
// ---------------------------------------------------------------------------

export function getTopGainers(
  coins: CoinMarketData[],
  count = 5
): TopMover[] {
  return [...coins]
    .sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h)
    .slice(0, count)
    .map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      currentPrice: c.currentPrice,
      priceChangePercentage24h: c.priceChangePercentage24h,
    }));
}

// ---------------------------------------------------------------------------
// getTopLosers
// ---------------------------------------------------------------------------

export function getTopLosers(
  coins: CoinMarketData[],
  count = 5
): TopMover[] {
  return [...coins]
    .sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h)
    .slice(0, count)
    .map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      currentPrice: c.currentPrice,
      priceChangePercentage24h: c.priceChangePercentage24h,
    }));
}

// ---------------------------------------------------------------------------
// calculateAltcoinSeason
// ---------------------------------------------------------------------------

const STABLECOIN_SYMBOLS = new Set([
  "usdt",
  "usdc",
  "dai",
  "busd",
  "tusd",
  "fdusd",
  "pyusd",
  "usdp",
]);

export function calculateAltcoinSeason(
  coins: CoinMarketData[]
): { score: number; isAltSeason: boolean; label: string } {
  const btc = coins.find((c) => c.symbol.toLowerCase() === "btc");
  const btcChange24h = btc?.priceChangePercentage24h ?? 0;

  const eligible = coins
    .filter((c) => {
      const sym = c.symbol.toLowerCase();
      if (sym === "btc") return false;
      if (STABLECOIN_SYMBOLS.has(sym)) return false;
      if (sym.includes("usd")) return false;
      return true;
    })
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 50);

  if (eligible.length === 0) {
    return { score: 0, isAltSeason: false, label: "Bitcoin Season" };
  }

  const outperformCount = eligible.filter(
    (c) => c.priceChangePercentage24h > btcChange24h
  ).length;

  const score = Math.round((outperformCount / eligible.length) * 100);
  const isAltSeason = score > 75;

  let label: string;
  if (score < 25) {
    label = "Bitcoin Season";
  } else if (score <= 50) {
    label = "BTC Leaning";
  } else if (score <= 75) {
    label = "Alt Leaning";
  } else {
    label = "Altcoin Season";
  }

  return { score, isAltSeason, label };
}
