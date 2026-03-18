// Uniswap V4 pool data providers
//
// V4 subgraph uses the same GraphQL schema as V3 (totalValueLockedUSD,
// derivedETH, poolDayData, etc.), so we reuse VelodromeStylePoolProvider.

import { VelodromeStylePoolProvider } from "../aerodrome/pool-provider";

// Subgraph IDs from The Graph's decentralized network
const UNISWAP_V4_SUBGRAPHS: Record<string, { subgraphId: string; displayName: string }> = {
  ethereum: {
    subgraphId: "DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G",
    displayName: "Uniswap V4 (Ethereum)",
  },
  arbitrum: {
    subgraphId: "G5TsTKNi8yhPSV7kycaE23oWbqv9zzNqR49FoEQjzq1r",
    displayName: "Uniswap V4 (Arbitrum)",
  },
  base: {
    subgraphId: "2L6yxqUZ7dT6GWoTy9qxNBkf9kEk65me3XPMvbGsmJUZ",
    displayName: "Uniswap V4 (Base)",
  },
  polygon: {
    subgraphId: "CwpebM66AH5uqS5sreKij8yEkkPcHvmyEs7EwFtdM5ND",
    displayName: "Uniswap V4 (Polygon)",
  },
};

export const uniswapV4PoolProviders: Record<string, VelodromeStylePoolProvider> = {};

for (const [chainId, config] of Object.entries(UNISWAP_V4_SUBGRAPHS)) {
  uniswapV4PoolProviders[chainId] = new VelodromeStylePoolProvider({
    protocolId: `uniswap-v4-${chainId}`,
    slug: "uniswap-v4",
    displayName: config.displayName,
    chainId,
    subgraphId: config.subgraphId,
  });
}
