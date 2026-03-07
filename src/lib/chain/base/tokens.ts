// Known Base chain token addresses and metadata

export interface KnownToken {
  address: string;
  symbol: string;
  decimals: number;
  coingeckoId?: string;
}

export const BASE_TOKENS: Record<string, KnownToken> = {
  WETH: {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    decimals: 18,
    coingeckoId: "weth",
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDbC: {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    symbol: "USDbC",
    decimals: 6,
    coingeckoId: "bridged-usd-coin-base",
  },
  AERO: {
    address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
    symbol: "AERO",
    decimals: 18,
    coingeckoId: "aerodrome-finance",
  },
  cbETH: {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    symbol: "cbETH",
    decimals: 18,
    coingeckoId: "coinbase-wrapped-staked-eth",
  },
  DAI: {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    decimals: 18,
    coingeckoId: "dai",
  },
};

export const DEFAULT_TOKEN_ADDRESSES = Object.values(BASE_TOKENS).map(
  (t) => t.address
);

// Sentinel address for native ETH balance
export const NATIVE_TOKEN_ADDRESS = "0xNATIVE";
