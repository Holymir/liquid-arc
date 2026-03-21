// DefiLlama API client with in-memory caching
// Follows the pattern from src/lib/market/coingecko-market.ts

import { cached } from "@/lib/cache";
import type {
  DefiLlamaProtocolRaw,
  DefiLlamaChainRaw,
  HistoricalTvlPointRaw,
  DefiProtocol,
  DefiChain,
  HistoricalTvlPoint,
} from "./defillama-types";

const LLAMA_API = "https://api.llama.fi";
const STABLECOINS_API = "https://stablecoins.llama.fi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`[defillama] ${url} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[defillama] ${url}:`, msg);
    return null;
  }
}

/** Downsample an array to at most `maxPoints` evenly-spaced entries. */
function downsample<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  result.push(data[data.length - 1]); // always include last point
  return result;
}

// ---------------------------------------------------------------------------
// getProtocols
// ---------------------------------------------------------------------------

export async function getProtocols(): Promise<DefiProtocol[]> {
  return cached("defillama:protocols", 300, async () => {
    // Use /protocols (not /v2/protocols) — the well-documented endpoint
    // that reliably includes chains[] and chainTvls fields.
    const raw = await fetchJson<DefiLlamaProtocolRaw[]>(
      `${LLAMA_API}/protocols`
    );
    if (!raw) return [];

    return raw
      .filter((p) => p.tvl > 0)
      .map((p) => {
        // Derive chains from chainTvls keys as primary source (most reliable),
        // fall back to chains array, then to primary chain field.
        // chainTvls can contain compound keys like "Ethereum-staking",
        // "Ethereum-borrowed", "Ethereum-pool2" — filter to base chain names only.
        const SUBCATEGORY_SUFFIXES = [
          "-staking", "-borrowed", "-pool2", "-vesting",
          "-treasury", "-offers", "-masterchef", "-governance",
        ];
        const STANDALONE_SUBCATEGORIES = new Set([
          "staking", "pool2", "borrowed", "treasury", "offers",
        ]);
        const chainTvlKeys = p.chainTvls
          ? Object.keys(p.chainTvls).filter(
              (k) =>
                !STANDALONE_SUBCATEGORIES.has(k) &&
                !SUBCATEGORY_SUFFIXES.some((s) => k.endsWith(s))
            )
          : [];
        const chains =
          chainTvlKeys.length > 0
            ? chainTvlKeys
            : p.chains?.length
              ? p.chains
              : p.chain
                ? [p.chain]
                : [];

        return {
          name: p.name,
          slug: p.slug,
          logo: p.logo ?? "",
          chain: p.chain ?? "",
          chains,
          tvl: p.tvl ?? 0,
          change1d: p.change_1d ?? null,
          change7d: p.change_7d ?? null,
          category: p.category ?? "",
          url: p.url ?? "",
          mcap: p.mcap ?? null,
        };
      });
  });
}

// ---------------------------------------------------------------------------
// getChains
// ---------------------------------------------------------------------------

export async function getChains(): Promise<DefiChain[]> {
  return cached("defillama:chains", 300, async () => {
    const raw = await fetchJson<DefiLlamaChainRaw[]>(
      `${LLAMA_API}/v2/chains`
    );
    if (!raw) return [];

    return raw
      .filter((c) => c.tvl > 0)
      .map((c) => ({
        name: c.name,
        tvl: c.tvl,
        tokenSymbol: c.tokenSymbol ?? "",
      }))
      .sort((a, b) => b.tvl - a.tvl);
  });
}

// ---------------------------------------------------------------------------
// getHistoricalTvl
// ---------------------------------------------------------------------------

export async function getHistoricalTvl(
  chain?: string
): Promise<HistoricalTvlPoint[]> {
  const cacheKey = `defillama:historical-tvl:${chain ?? "all"}`;

  return cached(cacheKey, 600, async () => {
    const url = chain
      ? `${LLAMA_API}/v2/historicalChainTvl/${encodeURIComponent(chain)}`
      : `${LLAMA_API}/v2/historicalChainTvl`;

    const raw = await fetchJson<HistoricalTvlPointRaw[]>(url);
    if (!raw || !Array.isArray(raw)) return [];

    const points: HistoricalTvlPoint[] = raw.map((p) => ({
      date: p.date,
      tvl: p.tvl,
    }));

    return downsample(points, 500);
  });
}

// ---------------------------------------------------------------------------
// getDexVolume
// ---------------------------------------------------------------------------

export async function getDexVolume(): Promise<number | null> {
  return cached("defillama:dex-volume", 300, async () => {
    const raw = await fetchJson<{
      total24h?: number;
      totalDataChart?: [number, number][];
    }>(`${LLAMA_API}/overview/dexs`);

    if (!raw) return null;
    if (raw.total24h) return raw.total24h;
    if (raw.totalDataChart?.length) {
      const last = raw.totalDataChart[raw.totalDataChart.length - 1];
      return last[1] ?? null;
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// getPerpsVolume
// ---------------------------------------------------------------------------

export async function getPerpsVolume(): Promise<number | null> {
  return cached("defillama:perps-volume", 300, async () => {
    const raw = await fetchJson<{
      total24h?: number;
      totalDataChart?: [number, number][];
    }>(`${LLAMA_API}/overview/derivatives`);

    if (!raw) return null;
    if (raw.total24h) return raw.total24h;
    if (raw.totalDataChart?.length) {
      const last = raw.totalDataChart[raw.totalDataChart.length - 1];
      return last[1] ?? null;
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// getStablecoinMcap
// ---------------------------------------------------------------------------

export async function getStablecoinMcap(): Promise<number | null> {
  return cached("defillama:stablecoin-mcap", 600, async () => {
    const raw = await fetchJson<{
      peggedAssets?: Array<{
        circulating?: { peggedUSD?: number };
      }>;
    }>(`${STABLECOINS_API}/stablecoins`);

    if (!raw?.peggedAssets) return null;

    let total = 0;
    for (const asset of raw.peggedAssets) {
      total += asset.circulating?.peggedUSD ?? 0;
    }
    return total > 0 ? total : null;
  });
}
