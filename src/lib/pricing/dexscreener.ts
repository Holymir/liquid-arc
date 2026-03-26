// DexScreener fallback price client

interface DexScreenerPair {
  priceUsd?: string;
  liquidity?: { usd?: number };
  baseToken?: { address?: string };
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

  const normalizedAddress = address.toLowerCase();

  // priceUsd is the BASE token's USD price, so we must only use pairs
  // where the searched token IS the base token. Otherwise we'd return
  // the price of a completely different token (e.g. AERO price for USDC).
  const basePairs = pairs.filter(
    (p) => p.priceUsd && p.baseToken?.address?.toLowerCase() === normalizedAddress
  );

  // Pick the pair with the most liquidity for the most reliable price
  const bestPair = (basePairs.length > 0 ? basePairs : [])
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

  if (!bestPair?.priceUsd) return null;

  const price = parseFloat(bestPair.priceUsd);
  return isNaN(price) ? null : price;
}
