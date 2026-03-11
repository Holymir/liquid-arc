// Uniswap V3 pool data providers
//
// Uses the same VelodromeStylePoolProvider since the subgraph schema is identical
// (Aerodrome/Velodrome are Uniswap V3 forks with the same GraphQL schema).

import { VelodromeStylePoolProvider } from "../aerodrome/pool-provider";

// Subgraph IDs from The Graph's decentralized network
const UNISWAP_V3_SUBGRAPHS: Record<string, { subgraphId: string; displayName: string }> = {
  ethereum: {
    subgraphId: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
    displayName: "Uniswap V3 (Ethereum)",
  },
  arbitrum: {
    subgraphId: "FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM",
    displayName: "Uniswap V3 (Arbitrum)",
  },
  polygon: {
    subgraphId: "3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbKJG7VZCbhjm",
    displayName: "Uniswap V3 (Polygon)",
  },
  base: {
    subgraphId: "FUbEPQw1oMghy39fwWBFY5fE6MXPXZQtjncQy2cXdrNS",
    displayName: "Uniswap V3 (Base)",
  },
};

export const uniswapV3PoolProviders: Record<string, VelodromeStylePoolProvider> = {};

for (const [chainId, config] of Object.entries(UNISWAP_V3_SUBGRAPHS)) {
  uniswapV3PoolProviders[chainId] = new VelodromeStylePoolProvider({
    protocolId: `uniswap-v3-${chainId}`,
    slug: "uniswap-v3",
    displayName: config.displayName,
    chainId,
    subgraphId: config.subgraphId,
  });
}
