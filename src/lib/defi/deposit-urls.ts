// Generate protocol-specific deposit URLs for pool rows.

import { EVM_CHAINS } from "@/lib/chain/evm/chains";

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

/**
 * Replace the wrapped native token address with the native symbol
 * that the protocol's UI expects (e.g. Uniswap wants "ETH" not the WETH address).
 * Looks up the chain config dynamically instead of hardcoding addresses.
 */
function nativeCurrencyId(chainId: string, tokenAddress: string): string {
  const chain = EVM_CHAINS[chainId];
  if (!chain) return tokenAddress;
  if (tokenAddress.toLowerCase() === chain.wrappedNativeAddress.toLowerCase()) {
    return chain.nativeSymbol;
  }
  return tokenAddress;
}

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
    const t0 = nativeCurrencyId(pool.chainId, pool.token0.address);
    const t1 = nativeCurrencyId(pool.chainId, pool.token1.address);
    return `https://app.uniswap.org/add/${t0}/${t1}/${fee}?chain=${chain}`;
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
