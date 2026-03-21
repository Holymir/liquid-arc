// TypeScript interfaces for DefiLlama API data

// --- Raw API response shapes ---

export interface DefiLlamaProtocolRaw {
  id: string;
  name: string;
  slug: string;
  logo: string;
  chain: string;
  chains: string[];
  /** Flat mapping of chain name → current TVL (always present on /protocols list endpoint) */
  chainTvls: Record<string, number>;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  category: string;
  url: string;
  mcap: number | null;
}

export interface DefiLlamaChainRaw {
  gecko_id: string | null;
  tvl: number;
  tokenSymbol: string;
  cmcId: string | null;
  name: string;
  chainId: number | null;
}

export interface HistoricalTvlPointRaw {
  date: number; // unix timestamp (seconds)
  tvl: number;
}

// --- App-level types ---

export interface DefiProtocol {
  name: string;
  slug: string;
  logo: string;
  chain: string;
  chains: string[];
  tvl: number;
  change1d: number | null;
  change7d: number | null;
  category: string;
  url: string;
  mcap: number | null;
}

export interface DefiChain {
  name: string;
  tvl: number;
  tokenSymbol: string;
}

export interface HistoricalTvlPoint {
  date: number; // unix timestamp (seconds)
  tvl: number;
}

export interface DefiOverviewResponse {
  totalTvl: number;
  tvlChange24h: number;
  historicalTvl: HistoricalTvlPoint[];
  protocols: DefiProtocol[];
  chains: DefiChain[];
  stablecoinMcap: number | null;
  dexVolume24h: number | null;
  perpsVolume24h: number | null;
}
