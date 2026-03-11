// EVM chain configurations — contract addresses and RPC endpoints
// Each chain needs: chainId, viem chain definition, RPC URL, known tokens

import { base, mainnet, arbitrum, polygon, optimism, bsc, avalanche } from "viem/chains";
import type { Chain } from "viem";

export interface EVMChainConfig {
  chainId: string;
  viemChain: Chain;
  rpcEnvVar: string;        // env var name for custom RPC URL
  defaultRpcUrl: string;    // public fallback
  nativeSymbol: string;
  wrappedNativeAddress: string;  // WETH/WMATIC/WBNB etc. for pricing native
  knownTokens: TokenConfig[];
  coingeckoPlatform: string;     // for CoinGecko API
}

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  coingeckoId?: string;
}

export const EVM_CHAINS: Record<string, EVMChainConfig> = {
  base: {
    chainId: "base",
    viemChain: base,
    rpcEnvVar: "BASE_RPC_URL",
    defaultRpcUrl: "https://mainnet.base.org",
    nativeSymbol: "ETH",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
    coingeckoPlatform: "base",
    knownTokens: [
      { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, coingeckoId: "weth" },
      { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", symbol: "USDbC", decimals: 6, coingeckoId: "bridged-usdc-base" },
      { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", decimals: 18, coingeckoId: "dai" },
      { address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", symbol: "AERO", decimals: 18, coingeckoId: "aerodrome-finance" },
      { address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", symbol: "cbETH", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
      { address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", symbol: "wstETH", decimals: 18, coingeckoId: "wrapped-steth" },
      { address: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c", symbol: "rETH", decimals: 18, coingeckoId: "rocket-pool-eth" },
      { address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", symbol: "BRETT", decimals: 18, coingeckoId: "brett" },
      { address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", symbol: "TOSHI", decimals: 18, coingeckoId: "toshi" },
      { address: "0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b", symbol: "PRIME", decimals: 18, coingeckoId: "echelon-prime" },
      { address: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b", symbol: "tBTC", decimals: 18, coingeckoId: "tbtc" },
      { address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", symbol: "cbBTC", decimals: 8, coingeckoId: "coinbase-wrapped-btc" },
      { address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", symbol: "DEGEN", decimals: 18, coingeckoId: "degen-base" },
      { address: "0x3C281A39944a2319aA653D81Cfd93Ca10983D234", symbol: "EURC", decimals: 6, coingeckoId: "euro-coin" },
    ],
  },
  ethereum: {
    chainId: "ethereum",
    viemChain: mainnet,
    rpcEnvVar: "ETHEREUM_RPC_URL",
    defaultRpcUrl: "https://eth.llamarpc.com",
    nativeSymbol: "ETH",
    wrappedNativeAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    coingeckoPlatform: "ethereum",
    knownTokens: [
      { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", decimals: 18, coingeckoId: "weth" },
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18, coingeckoId: "dai" },
      { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
    ],
  },
  arbitrum: {
    chainId: "arbitrum",
    viemChain: arbitrum,
    rpcEnvVar: "ARBITRUM_RPC_URL",
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeSymbol: "ETH",
    wrappedNativeAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    coingeckoPlatform: "arbitrum-one",
    knownTokens: [
      { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", decimals: 18, coingeckoId: "weth" },
      { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
      { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", decimals: 18, coingeckoId: "arbitrum" },
    ],
  },
  polygon: {
    chainId: "polygon",
    viemChain: polygon,
    rpcEnvVar: "POLYGON_RPC_URL",
    defaultRpcUrl: "https://polygon-rpc.com",
    nativeSymbol: "MATIC",
    wrappedNativeAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    coingeckoPlatform: "polygon-pos",
    knownTokens: [
      { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", symbol: "WMATIC", decimals: 18, coingeckoId: "wmatic" },
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", decimals: 18, coingeckoId: "weth" },
    ],
  },
  optimism: {
    chainId: "optimism",
    viemChain: optimism,
    rpcEnvVar: "OPTIMISM_RPC_URL",
    defaultRpcUrl: "https://mainnet.optimism.io",
    nativeSymbol: "ETH",
    wrappedNativeAddress: "0x4200000000000000000000000000000000000006",
    coingeckoPlatform: "optimistic-ethereum",
    knownTokens: [
      { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, coingeckoId: "weth" },
      { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
      { address: "0x4200000000000000000000000000000000000042", symbol: "OP", decimals: 18, coingeckoId: "optimism" },
      { address: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db", symbol: "VELO", decimals: 18, coingeckoId: "velodrome-finance" },
      { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", decimals: 18, coingeckoId: "dai" },
      { address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
      { address: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb", symbol: "wstETH", decimals: 18, coingeckoId: "wrapped-steth" },
      { address: "0x9Bcef72be871e61ED4fBbc7630889beE758eb81D", symbol: "rETH", decimals: 18, coingeckoId: "rocket-pool-eth" },
      { address: "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4", symbol: "SNX", decimals: 18, coingeckoId: "havven" },
      { address: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6", symbol: "LINK", decimals: 18, coingeckoId: "chainlink" },
    ],
  },
  bsc: {
    chainId: "bsc",
    viemChain: bsc,
    rpcEnvVar: "BSC_RPC_URL",
    defaultRpcUrl: "https://bsc-dataseed1.binance.org",
    nativeSymbol: "BNB",
    wrappedNativeAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    coingeckoPlatform: "binance-smart-chain",
    knownTokens: [
      { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", decimals: 18, coingeckoId: "wbnb" },
      { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18, coingeckoId: "usd-coin" },
      { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18, coingeckoId: "tether" },
      { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", decimals: 18, coingeckoId: "ethereum" },
    ],
  },
  avalanche: {
    chainId: "avalanche",
    viemChain: avalanche,
    rpcEnvVar: "AVALANCHE_RPC_URL",
    defaultRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    nativeSymbol: "AVAX",
    wrappedNativeAddress: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    coingeckoPlatform: "avalanche",
    knownTokens: [
      { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", symbol: "WAVAX", decimals: 18, coingeckoId: "wrapped-avax" },
      { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
      { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", symbol: "USDT", decimals: 6, coingeckoId: "tether" },
    ],
  },
};
