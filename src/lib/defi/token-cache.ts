// In-memory token metadata cache.
// Once a symbol/decimals is fetched successfully, it persists for the session.
// Prevents "???" on intermittent RPC failures.

interface TokenMeta {
  symbol: string;
  decimals: number;
}

const cache = new Map<string, TokenMeta>();

export function getCachedTokenMeta(address: string): TokenMeta | undefined {
  return cache.get(address.toLowerCase());
}

export function setCachedTokenMeta(address: string, meta: TokenMeta): void {
  // Don't cache failed lookups
  if (meta.symbol === "???" || meta.symbol === "UNKNOWN") return;
  cache.set(address.toLowerCase(), meta);
}

export function getOrDefault(address: string, fetched: TokenMeta): TokenMeta {
  if (fetched.symbol !== "???" && fetched.symbol !== "UNKNOWN") {
    setCachedTokenMeta(address, fetched);
    return fetched;
  }
  // Return cached version if available, otherwise return the "???" fallback
  return getCachedTokenMeta(address) ?? fetched;
}
