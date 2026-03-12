// Shared Solana token price history fetcher
//
// Primary: Birdeye API (requires BIRDEYE_API_KEY env var)
// Fallback: DexScreener API (no key needed, limited history)

import type { TokenPriceHistory } from "../types";

/**
 * Fetch historical USD prices for a Solana token.
 * Returns empty prices if both sources fail (pools still appear, just no volatility data).
 */
export async function fetchSolanaTokenPriceHistory(
  tokenAddress: string,
  days: number
): Promise<TokenPriceHistory> {
  const empty: TokenPriceHistory = { tokenAddress, prices: [] };

  // Try Birdeye first
  const birdeyeKey = process.env.BIRDEYE_API_KEY;
  if (birdeyeKey) {
    try {
      const result = await fetchFromBirdeye(tokenAddress, days, birdeyeKey);
      if (result.prices.length > 0) return result;
    } catch (err) {
      console.warn(`[solana-prices] Birdeye failed for ${tokenAddress}:`, err);
    }
  }

  // Fallback: DexScreener
  try {
    return await fetchFromDexScreener(tokenAddress);
  } catch (err) {
    console.warn(`[solana-prices] DexScreener failed for ${tokenAddress}:`, err);
  }

  return empty;
}

async function fetchFromBirdeye(
  tokenAddress: string,
  days: number,
  apiKey: string
): Promise<TokenPriceHistory> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const interval = days <= 7 ? "1H" : "1D";

  const url = `https://public-api.birdeye.so/defi/history_price?address=${tokenAddress}&address_type=token&type=${interval}&time_from=${from}&time_to=${now}`;
  const res = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Birdeye HTTP ${res.status}`);

  const json = await res.json();
  const items: { unixTime: number; value: number }[] = json?.data?.items ?? [];

  return {
    tokenAddress,
    prices: items.map((item) => ({
      date: new Date(item.unixTime * 1000),
      priceUsd: item.value,
    })),
  };
}

async function fetchFromDexScreener(
  tokenAddress: string
): Promise<TokenPriceHistory> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
  );
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);

  const json = await res.json();
  const pair = json?.pairs?.[0];
  if (!pair?.priceUsd) {
    return { tokenAddress, prices: [] };
  }

  // DexScreener only gives current price — return a single data point
  return {
    tokenAddress,
    prices: [
      {
        date: new Date(),
        priceUsd: parseFloat(pair.priceUsd),
      },
    ],
  };
}
