// DexScreener fallback price client

interface DexScreenerPair {
  priceUsd?: string;
  liquidity?: { usd?: number };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

export async function getDexScreenerPrice(
  address: string
): Promise<number | null> {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${address}`,
    { next: { revalidate: 0 } }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as DexScreenerResponse;
  const pairs = data.pairs ?? [];

  if (pairs.length === 0) return null;

  // Pick the pair with the most liquidity for the most reliable price
  const bestPair = pairs
    .filter((p) => p.priceUsd)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

  if (!bestPair?.priceUsd) return null;

  const price = parseFloat(bestPair.priceUsd);
  return isNaN(price) ? null : price;
}
