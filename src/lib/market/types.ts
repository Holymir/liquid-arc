export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  sparklineIn7d: number[];
  ath: number;
  athChangePercentage: number;
}

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
  priceChange24h: number;
  price: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string; thumb: string };
  description: string;
  links: { homepage: string[]; twitter: string; telegram: string };
  categories: string[];
  marketData: {
    currentPrice: number;
    marketCap: number;
    totalVolume: number;
    priceChange24h: number;
    priceChangePercentage24h: number;
    priceChangePercentage7d: number;
    priceChangePercentage30d: number;
    circulatingSupply: number;
    totalSupply: number | null;
    maxSupply: number | null;
    ath: number;
    athDate: string;
    atl: number;
    atlDate: string;
  };
}

export interface ChartPoint {
  timestamp: number;
  price: number;
}

export interface MarketCategory {
  id: string;
  name: string;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  top3Coins: string[];
}

export interface FearGreedData {
  value: number; // 0-100
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  timestamp: number;
  previousClose: number; // yesterday's value
}

export interface TopMover {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  priceChangePercentage24h: number;
}
