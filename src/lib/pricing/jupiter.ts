// Jupiter Price API — primary price source for Solana tokens.
// Same source Phantom wallet uses. No API key required for basic usage.

interface JupiterPriceData {
  id: string;
  type: string;
  price: string;
}

interface JupiterPriceResponse {
  data: Record<string, JupiterPriceData>;
}

/**
 * Fetch USD prices for Solana tokens from Jupiter Price API.
 * Accepts up to 100 mint addresses at once.
 * Returns a Map of mint address → USD price.
 */
export async function getJupiterPrices(
  addresses: string[]
): Promise<Map<string, number>> {
  if (addresses.length === 0) return new Map();

  const prices = new Map<string, number>();

  // Jupiter accepts up to 100 tokens per request
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += 100) {
    batches.push(addresses.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const ids = batch.join(",");
      const res = await fetch(
        `https://api.jup.ag/price/v2?ids=${ids}`,
        {
          signal: AbortSignal.timeout(10_000),
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        console.warn(`[jupiter-price] HTTP ${res.status}`);
        continue;
      }

      const json = (await res.json()) as JupiterPriceResponse;

      for (const [mint, data] of Object.entries(json.data ?? {})) {
        if (data?.price) {
          const price = parseFloat(data.price);
          if (!isNaN(price) && price > 0) {
            prices.set(mint, price);
          }
        }
      }
    } catch (err) {
      console.warn(
        "[jupiter-price] fetch failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return prices;
}
