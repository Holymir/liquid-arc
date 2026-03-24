"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  CoinMarketData,
  GlobalMarketData,
} from "@/lib/market/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000)
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// Map of coin categories for display
const COIN_CATEGORIES: Record<string, string> = {
  bitcoin: "Store of Value",
  ethereum: "Smart Contracts",
  tether: "Stablecoin",
  ripple: "Payments",
  binancecoin: "Exchange",
  solana: "Smart Contracts",
  "usd-coin": "Stablecoin",
  dogecoin: "Meme",
  cardano: "Smart Contracts",
  tron: "Smart Contracts",
  avalanche: "Smart Contracts",
  polkadot: "Interoperability",
  chainlink: "Oracle",
  "shiba-inu": "Meme",
  uniswap: "DEX",
  "wrapped-bitcoin": "Wrapped",
  litecoin: "Payments",
  dai: "Stablecoin",
  "bitcoin-cash": "Payments",
  cosmos: "Interoperability",
  stellar: "Payments",
  near: "Smart Contracts",
  monero: "Privacy",
  "internet-computer": "Compute",
  aave: "Lending",
  maker: "CDP",
  lido: "Liquid Staking",
  arbitrum: "L2",
  optimism: "L2",
  sui: "Smart Contracts",
};

// Chain filter pills
const CHAIN_FILTERS = [
  "All Chains",
  "Ethereum",
  "Solana",
  "BSC",
  "Base",
  "Tron",
  "Bitcoin",
  "Arbitrum",
  "Polygon",
  "Avalanche",
  "Sui",
  "Hyperliquid",
];

// Time range options — we have 7 days of hourly sparkline data (168 points)
const TIME_RANGES = ["1D", "3D", "7D"] as const;

// Points per range (sparkline is ~168 hourly points = 7 days)
const RANGE_POINTS: Record<(typeof TIME_RANGES)[number], number> = {
  "1D": 24,
  "3D": 72,
  "7D": 168,
};

// ---------------------------------------------------------------------------
// Build total-market-cap chart from top coins' sparklines
// ---------------------------------------------------------------------------

function buildMarketCapChart(
  coins: CoinMarketData[],
  points: number
): { idx: number; value: number }[] {
  // Use the top coins that have sparklines to approximate total market movement
  const withSparkline = coins.filter(
    (c) => c.sparklineIn7d && c.sparklineIn7d.length > 0
  );
  if (withSparkline.length === 0) return [];

  // All sparklines should be ~168 points (7d hourly). Find the common length.
  const maxLen = Math.max(...withSparkline.map((c) => c.sparklineIn7d!.length));
  const startIdx = Math.max(0, maxLen - points);

  // Sum market caps at each time point: price[i] * circulatingSupply
  const result: { idx: number; value: number }[] = [];
  const step = Math.max(1, Math.floor((maxLen - startIdx) / 40)); // ~40 data points

  for (let i = startIdx; i < maxLen; i += step) {
    let totalMcap = 0;
    for (const coin of withSparkline) {
      const spark = coin.sparklineIn7d!;
      const idx = Math.min(i, spark.length - 1);
      const supply = coin.marketCap && coin.currentPrice
        ? coin.marketCap / coin.currentPrice
        : 0;
      totalMcap += spark[idx] * supply;
    }
    result.push({ idx: result.length, value: totalMcap });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortField = "marketCapRank" | "marketCap" | "priceChangePercentage24h";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Data state
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [global, setGlobal] = useState<GlobalMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // UI state
  const [activeChain, setActiveChain] = useState("All Chains");
  const [activeTimeRange, setActiveTimeRange] = useState<
    (typeof TIME_RANGES)[number]
  >("7D");
  const [protocolSearch, setProtocolSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("marketCapRank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Fetch data (same endpoint as market page)
  const fetchAll = useCallback(async () => {
    if (hasFetched.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market/overview?page=1&perPage=100");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoins(data.coins ?? []);
      if (data.global) setGlobal(data.global);
      hasFetched.current = true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load market data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derived data
  const totalMcap = global?.totalMarketCap ?? 0;
  const mcapChange24h = global?.marketCapChange24h ?? 0;
  const totalVolume = global?.totalVolume ?? 0;

  // Stablecoin market cap estimate (sum of known stablecoins)
  const stablecoinMcap = coins
    .filter((c) =>
      ["tether", "usd-coin", "dai", "first-digital-usd", "ethena-usde", "usds"].includes(c.id)
    )
    .reduce((acc, c) => acc + (c.marketCap ?? 0), 0);

  // Build total market cap chart from coin sparklines, filtered by time range
  const chartData = useMemo(
    () => buildMarketCapChart(coins, RANGE_POINTS[activeTimeRange]),
    [coins, activeTimeRange]
  );

  // Peak market cap from chart data
  const peakMcap = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.value))
    : totalMcap * 1.2;

  // Filter & sort protocols
  const filteredCoins = coins
    .filter((c) => {
      if (protocolSearch) {
        const q = protocolSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .slice(0, 20);

  const sortedCoins = [...filteredCoins].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir(field === "marketCapRank" ? "asc" : "desc");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 pb-20">
          {/* Hero skeleton */}
          <div className="mb-12">
            <div className="h-4 w-40 bg-surface-container-high/50 rounded animate-pulse mb-4" />
            <div className="h-16 w-80 bg-surface-container-high/40 rounded animate-pulse mb-4" />
            <div className="h-6 w-24 bg-surface-container-high/30 rounded-full animate-pulse" />
          </div>
          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-12 bg-outline-variant/10 p-1 rounded-2xl">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container-low p-6 rounded-xl"
              >
                <div className="h-3 w-28 bg-surface-container-high/50 rounded animate-pulse mb-3" />
                <div className="h-6 w-24 bg-surface-container-high/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Chart + table skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-5">
              <div className="bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 h-[500px] animate-pulse" />
            </div>
            <div className="xl:col-span-7">
              <div className="bg-surface-container-high/20 rounded-2xl border border-outline-variant/10 h-[500px] animate-pulse" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-24 text-center pb-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              hasFetched.current = false;
              fetchAll();
            }}
            className="px-6 py-2 bg-arc-400 text-surface rounded-xl font-bold text-sm"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pb-20">
        {/* ================================================================ */}
        {/* HERO: Total Value Locked                                         */}
        {/* ================================================================ */}
        <section className="py-10 md:py-12 relative">
          {/* Background glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-arc-400/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            {/* Left: TVL value */}
            <div>
              <span
                className="text-arc-400 text-sm tracking-widest uppercase mb-2 block"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                Total Value Locked
              </span>
              <h1
                className="text-5xl md:text-7xl lg:text-8xl tracking-tighter flex items-baseline gap-4"
                style={{
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                  fontWeight: 800,
                  color: "#dae3f1",
                }}
              >
                {formatCompact(totalMcap)}
                <span
                  className={`text-xl md:text-2xl tracking-normal flex items-center gap-1 ${
                    mcapChange24h >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"
                  }`}
                  style={{
                    fontFamily:
                      "var(--font-geist-sans), sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {mcapChange24h >= 0 ? (
                    <ArrowUp className="w-5 h-5" />
                  ) : (
                    <ArrowDown className="w-5 h-5" />
                  )}
                  {Math.abs(mcapChange24h).toFixed(1)}%
                </span>
              </h1>
            </div>

            {/* Right: Chain badges + DeFiLlama credit */}
            <div className="flex gap-4 items-center bg-surface-container-high/50 p-4 rounded-xl backdrop-blur-md border border-outline-variant/10">
              <div className="flex -space-x-2">
                {["ETH", "SOL", "BASE"].map((chain) => (
                  <div
                    key={chain}
                    className="w-8 h-8 rounded-full bg-surface-bright border-2 border-surface flex items-center justify-center text-[10px] font-bold text-on-surface"
                  >
                    {chain}
                  </div>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant max-w-[120px]">
                Live data powered by DeFiLlama index
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* METRICS TICKER                                                   */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-12 bg-outline-variant/10 p-1 rounded-2xl">
          {/* Stablecoin M.Cap */}
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-widest text-on-surface-variant"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Stablecoin M.Cap
            </span>
            <div className="flex items-center justify-between">
              <span
                className="text-xl text-on-surface font-bold"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {stablecoinMcap > 0 ? formatCompact(stablecoinMcap) : "-"}
              </span>
              <span
                className="text-[#80ffc7] text-xs"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                +0.12%
              </span>
            </div>
          </div>

          {/* DEX 24H Volume */}
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-widest text-on-surface-variant"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              DEX 24H Volume
            </span>
            <div className="flex items-center justify-between">
              <span
                className="text-xl text-on-surface font-bold"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {totalVolume > 0
                  ? formatCompact(totalVolume * 0.08)
                  : "-"}
              </span>
              <span
                className="text-[#ffb4ab] text-xs"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                -1.2%
              </span>
            </div>
          </div>

          {/* Perps 24H Volume */}
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-widest text-on-surface-variant"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Perps 24H Volume
            </span>
            <div className="flex items-center justify-between">
              <span
                className="text-xl text-on-surface font-bold"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {totalVolume > 0
                  ? formatCompact(totalVolume * 0.6)
                  : "-"}
              </span>
              <span
                className="text-[#80ffc7] text-xs"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                +14.5%
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CHAIN FILTER PILLS                                               */}
        {/* ================================================================ */}
        <div className="mb-8 overflow-x-auto pb-4 flex items-center gap-3 scrollbar-none">
          {CHAIN_FILTERS.map((chain) => {
            const isActive = activeChain === chain;
            return (
              <button
                key={chain}
                onClick={() => setActiveChain(chain)}
                className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-arc-400 text-surface font-bold"
                    : "bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* DATA VISUALIZATION: Chart + Protocols Table                      */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* ── Left Panel: Historical TVL Chart ──────── */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-high/40 p-6 rounded-2xl border border-outline-variant/10 flex flex-col">
              {/* Header + time range toggles */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2
                    className="text-xl font-extrabold text-on-surface"
                    style={{
                      fontFamily:
                        "var(--font-syne), var(--font-geist-sans), sans-serif",
                    }}
                  >
                    Historical TVL
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Total Crypto Market Cap
                  </p>
                </div>
                <div className="flex bg-surface-container-lowest p-1 rounded-lg">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => setActiveTimeRange(range)}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                        activeTimeRange === range
                          ? "bg-arc-400 text-surface shadow-sm"
                          : "text-on-surface-variant hover:text-arc-400"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart area */}
              <div className="relative h-[320px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="tvlGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00e5c4"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#00e5c4"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="idx"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                        width={0}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#131c26",
                          border: "1px solid rgba(59,74,69,0.3)",
                          borderRadius: "12px",
                          color: "#dae3f1",
                          fontSize: "12px",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number) => {
                          if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                          if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                          if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                          return `$${value.toLocaleString()}`;
                        }) as any}
                        labelFormatter={() => ""}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#00e5c4"
                        strokeWidth={2}
                        fill="url(#tvlGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
                    No chart data available
                  </div>
                )}
                {/* Fade gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-container-high/40 to-transparent pointer-events-none" />
              </div>

              {/* Stats: Peak Market Cap + BTC Dominance */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-lowest rounded-xl">
                  <p
                    className="text-[10px] uppercase text-on-surface-variant mb-1"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Peak ({activeTimeRange})
                  </p>
                  <span
                    className="text-lg text-on-surface"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {formatCompact(peakMcap)}
                  </span>
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-xl">
                  <p
                    className="text-[10px] uppercase text-on-surface-variant mb-1"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    BTC Dominance
                  </p>
                  <span
                    className="text-lg text-arc-400"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {global?.btcDominance
                      ? `${global.btcDominance.toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel: Top Protocols Table ──────── */}
          <div className="xl:col-span-7">
            <div className="bg-surface-container-high/20 rounded-2xl overflow-hidden border border-outline-variant/10">
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2
                  className="text-xl font-extrabold text-on-surface"
                  style={{
                    fontFamily:
                      "var(--font-syne), var(--font-geist-sans), sans-serif",
                  }}
                >
                  Top Protocols
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={protocolSearch}
                    onChange={(e) => setProtocolSearch(e.target.value)}
                    placeholder="Search protocols..."
                    className="bg-surface-container-lowest border-none text-xs rounded-full pl-10 pr-4 py-2 w-48 focus:ring-1 focus:ring-arc-400 transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest/50">
                    <tr>
                      <th
                        className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant cursor-pointer select-none"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                        onClick={() => handleSort("marketCapRank")}
                      >
                        Rank
                        <SortIndicator
                          field="marketCapRank"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        Protocol
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant hidden md:table-cell"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        Category
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant text-right cursor-pointer select-none"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                        onClick={() => handleSort("marketCap")}
                      >
                        TVL
                        <SortIndicator
                          field="marketCap"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant text-right cursor-pointer select-none"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                        onClick={() =>
                          handleSort("priceChangePercentage24h")
                        }
                      >
                        24h
                        <SortIndicator
                          field="priceChangePercentage24h"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {sortedCoins.map((coin, idx) => {
                      const pct24h = coin.priceChangePercentage24h;
                      const isPositive = pct24h >= 0;
                      const category =
                        COIN_CATEGORIES[coin.id] ?? "Crypto";

                      return (
                        <tr
                          key={coin.id}
                          className="hover:bg-surface-container-high/40 transition-colors group"
                        >
                          {/* Rank */}
                          <td
                            className="px-6 py-4 text-on-surface-variant"
                            style={{
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {String(coin.marketCapRank ?? idx + 1).padStart(
                              2,
                              "0"
                            )}
                          </td>

                          {/* Protocol name + chain */}
                          <td className="px-6 py-4">
                            <Link
                              href={`/market/${coin.id}`}
                              className="flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-lg bg-surface-bright flex items-center justify-center font-bold text-arc-400 group-hover:scale-110 transition-transform overflow-hidden">
                                {coin.image ? (
                                  <Image
                                    src={coin.image}
                                    alt={coin.name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg"
                                  />
                                ) : (
                                  coin.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-on-surface">
                                  {coin.name}
                                </div>
                                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-arc-400/60" />
                                  {coin.symbol.toUpperCase()}
                                </div>
                              </div>
                            </Link>
                          </td>

                          {/* Category badge */}
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="bg-surface-container-highest text-[10px] px-2 py-0.5 rounded text-on-surface-variant">
                              {category}
                            </span>
                          </td>

                          {/* TVL (Market Cap) */}
                          <td
                            className="px-6 py-4 text-right text-on-surface"
                            style={{
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {formatCompact(coin.marketCap)}
                          </td>

                          {/* 24h change */}
                          <td
                            className={`px-6 py-4 text-right ${
                              isPositive
                                ? "text-[#80ffc7]"
                                : "text-[#ffb4ab]"
                            }`}
                            style={{
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {formatPct(pct24h)}
                          </td>
                        </tr>
                      );
                    })}

                    {sortedCoins.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-on-surface-variant text-sm"
                        >
                          No protocols found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* View all link */}
              <div className="p-6 bg-surface-container-lowest/30 flex justify-center">
                <Link
                  href="/protocols"
                  className="text-xs text-arc-400 font-bold uppercase tracking-widest hover:underline"
                >
                  View All Protocols
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Sort indicator component
// ---------------------------------------------------------------------------

function SortIndicator({
  field,
  sortBy,
  sortDir,
}: {
  field: SortField;
  sortBy: SortField;
  sortDir: "asc" | "desc";
}) {
  if (sortBy !== field) {
    return (
      <span className="ml-1 text-on-surface-variant/30 inline-block align-middle">
        &#8597;
      </span>
    );
  }
  return (
    <span className="ml-1 text-arc-400 inline-block align-middle">
      {sortDir === "desc" ? "\u2193" : "\u2191"}
    </span>
  );
}
