// Generate protocol-specific deposit URLs for pool rows.

/** Wrapped native token addresses that Uniswap expects as "ETH" */
const WETH_ADDRESSES = new Set([
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // Ethereum WETH
  "0x4200000000000000000000000000000000000006", // Base / Optimism WETH
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // Arbitrum WETH
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // Polygon WMATIC
  "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // Polygon WETH
]);

const CHAIN_NAMES: Record<string, string> = {
  ethereum: "mainnet",
  arbitrum: "arbitrum",
  polygon: "polygon",
  base: "base",
  optimism: "optimism",
};

const BLOCK_EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io/address",
  arbitrum: "https://arbiscan.io/address",
  polygon: "https://polygonscan.com/address",
  base: "https://basescan.org/address",
  optimism: "https://optimistic.etherscan.io/address",
  solana: "https://solscan.io/account",
};

export function getDepositUrl(pool: {
  protocol: string;
  chainId: string;
  poolAddress: string;
  token0: { address: string };
  token1: { address: string };
  feeTier: number | null;
}): string {
  const slug = pool.protocol;

  if (slug === "aerodrome") {
    return `https://aerodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}`;
  }

  if (slug === "velodrome") {
    return `https://velodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}`;
  }

  if (slug === "uniswap-v3") {
    const chain = CHAIN_NAMES[pool.chainId] ?? "mainnet";
    const fee = pool.feeTier ?? 3000;
    // Uniswap expects "ETH" instead of the WETH contract address
    const toUniCurrency = (addr: string) =>
      WETH_ADDRESSES.has(addr.toLowerCase()) ? "ETH" : addr;
    return `https://app.uniswap.org/add/${toUniCurrency(pool.token0.address)}/${toUniCurrency(pool.token1.address)}/${fee}?chain=${chain}`;
  }

  if (slug === "raydium") {
    return `https://raydium.io/clmm/create-position/?pool_id=${pool.poolAddress}`;
  }

  if (slug === "orca") {
    return `https://www.orca.so/pools/${pool.poolAddress}`;
  }

  // Fallback: block explorer
  const explorer = BLOCK_EXPLORERS[pool.chainId] ?? BLOCK_EXPLORERS.ethereum;
  return `${explorer}/${pool.poolAddress}`;
}
