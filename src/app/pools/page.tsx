"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PoolsSidebar } from "@/components/pools/PoolsSidebar";
import { Search, ExternalLink, ChevronLeft, ChevronRight, Loader2, Filter, X, Zap } from "lucide-react";
import { getDepositUrl } from "@/lib/defi/deposit-urls";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PoolToken {
  address: string;
  symbol: string;
  decimals: number;
}

interface PoolRow {
  poolAddress: string;
  chainId: string;
  protocol: string;
  protocolName: string;
  token0: PoolToken;
  token1: PoolToken;
  feeTier: number | null;
  poolType: string | null;
  tvlUsd: number | null;
  volume24hUsd: number | null;
  volume7dUsd: number | null;
  fees24hUsd: number | null;
  fees7dUsd: number | null;
  apr24h: number | null;
  apr7d: number | null;
  emissionsApr: number | null;
  token0Volatility30d: number | null;
  token1Volatility30d: number | null;
  pairCorrelation30d: number | null;
  lastSyncedAt: string | null;
}

interface PoolsResponse {
  pools: PoolRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortField = "tvlUsd" | "volume24hUsd" | "fees24hUsd" | "apr24h" | "apr7d";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUsd(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value.toFixed(2)}%`;
}

function feeTierLabel(feeTier: number | null): string {
  if (feeTier == null) return "";
  return `${(feeTier / 10_000).toFixed(2)}%`;
}

// Token color palette for pair circle icons
const TOKEN_COLORS: Record<string, string> = {
  WETH: "#627eea",
  ETH: "#627eea",
  USDC: "#2775ca",
  USDT: "#26a17b",
  WBTC: "#f7931a",
  BTC: "#f7931a",
  DAI: "#f5ac37",
  PEPE: "#3d9430",
  SOL: "#9945ff",
  MATIC: "#8247e5",
  ARB: "#28a0f0",
  OP: "#ff0420",
  LINK: "#2a5ada",
  UNI: "#ff007a",
  AAVE: "#b6509e",
  CRV: "#0000ff",
};

function getTokenColor(symbol: string): string {
  return TOKEN_COLORS[symbol.toUpperCase()] ?? "#6b7280";
}

// Chain display names
const CHAIN_LABELS: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  solana: "Solana",
  bsc: "BNB Chain",
  avalanche: "Avalanche",
};

// Protocol color dots
const PROTOCOL_DOT: Record<string, string> = {
  aerodrome: "bg-blue-400",
  velodrome: "bg-red-400",
  "uniswap-v3": "bg-pink-400",
  raydium: "bg-cyan-400",
  orca: "bg-amber-400",
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RangeFilter {
  min: string;
  max: string;
}

const FILTER_COLUMNS: { key: string; label: string; prefix: string; suffix: string }[] = [
  { key: "tvlUsd", label: "TVL", prefix: "$", suffix: "" },
  { key: "volume24hUsd", label: "Volume 24h", prefix: "$", suffix: "" },
  { key: "fees24hUsd", label: "Fees 24h", prefix: "$", suffix: "" },
  { key: "apr24h", label: "APR 24h", prefix: "", suffix: "%" },
  { key: "apr7d", label: "APR 7d", prefix: "", suffix: "%" },
  { key: "pairCorrelation30d", label: "Correlation", prefix: "", suffix: "" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("tvlUsd");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // TVL range filter for sidebar
  const [tvlRange, setTvlRange] = useState<RangeFilter>({ min: "", max: "" });
  // Boosted APR only toggle
  const [boostedOnly, setBoostedOnly] = useState(false);

  // Range filters state — debounced values used for API calls
  const emptyFilters = (): Record<string, RangeFilter> =>
    Object.fromEntries(FILTER_COLUMNS.map((c) => [c.key, { min: "", max: "" }]));
  const [filterInputs, setFilterInputs] = useState<Record<string, RangeFilter>>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, RangeFilter>>(emptyFilters);

  // Debounce filter inputs
  const filterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      setAppliedFilters(filterInputs);
      setPage(1);
    }, 600);
    return () => clearTimeout(filterTimer.current);
  }, [filterInputs]);

  // Sync TVL range into filterInputs
  const tvlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(tvlTimer.current);
    tvlTimer.current = setTimeout(() => {
      setFilterInputs((prev) => ({
        ...prev,
        tvlUsd: { min: tvlRange.min, max: tvlRange.max },
      }));
    }, 400);
    return () => clearTimeout(tvlTimer.current);
  }, [tvlRange]);

  const clearAllFilters = () => {
    const empty = emptyFilters();
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setSelectedChains(new Set());
    setSelectedProtocols(new Set());
    setTvlRange({ min: "", max: "" });
    setBoostedOnly(false);
    setPage(1);
  };

  // Yield alert banner
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [refetching, setRefetching] = useState(false);
  const hasFetched = useRef(false);

  const fetchPools = useCallback(async () => {
    if (hasFetched.current) {
      setRefetching(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortDir,
        page: String(page),
        limit: "50",
      });
      if (search.trim()) params.set("token", search.trim());
      if (selectedChains.size > 0) params.set("chain", [...selectedChains].join(","));
      if (selectedProtocols.size > 0) params.set("protocol", [...selectedProtocols].join(","));

      // Add range filters
      for (const [key, range] of Object.entries(appliedFilters)) {
        if (range.min) params.set(`min_${key}`, range.min);
        if (range.max) params.set(`max_${key}`, range.max);
      }

      // Boosted APR filter
      if (boostedOnly) {
        params.set("min_emissionsApr", "0.01");
      }

      const res = await fetch(`/api/pools?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PoolsResponse = await res.json();
      setPools(data.pools);
      setPagination(data.pagination);
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pools");
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [sortBy, sortDir, page, search, appliedFilters, selectedChains, selectedProtocols, boostedOnly]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field)
      return <span className="text-on-surface-variant/30 ml-1 text-[10px]">&#8597;</span>;
    return (
      <span className="text-arc-400 ml-1 text-[10px]">
        {sortDir === "desc" ? "\u2193" : "\u2191"}
      </span>
    );
  };

  const handleToggleChain = (chain: string) => {
    setSelectedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chain)) next.delete(chain);
      else next.add(chain);
      return next;
    });
    setPage(1);
  };

  const handleToggleProtocol = (protocol: string) => {
    setSelectedProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(protocol)) next.delete(protocol);
      else next.add(protocol);
      return next;
    });
    setPage(1);
  };

  const handleTvlRangeChange = (field: "min" | "max", value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setTvlRange((prev) => ({ ...prev, [field]: value }));
  };

  // Pagination helpers
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages: (number | "...")[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">
        {/* ── Page Header ── */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface mb-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Pool Explorer
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base">
              Discover and analyze deep liquidity across 12 chains.
            </p>
          </div>

          {/* Search bar — right side */}
          <div className="flex items-center gap-3">
            {refetching && <Loader2 className="w-4 h-4 text-arc-400 animate-spin" />}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-arc-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition" />
              <div className="relative bg-surface-container-high px-4 py-2.5 rounded-xl flex items-center gap-3 border border-white/5">
                <Search className="w-4 h-4 text-arc-400" />
                <input
                  type="text"
                  placeholder="Search pair, token or protocol..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-48 sm:w-64 placeholder:text-on-surface-variant/50 text-on-surface"
                />
              </div>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen((o) => !o)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border border-white/5 bg-surface-container-high text-on-surface-variant hover:text-arc-400 hover:border-arc-400/30 transition-all"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedChains.size + selectedProtocols.size) > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-arc-400/20 text-arc-400 text-[10px] font-bold">
                  {selectedChains.size + selectedProtocols.size}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-6 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Yield Alert Banner ── */}
        {!alertDismissed && !loading && pools.length > 0 && (() => {
          const topPool = [...pools].sort((a, b) => {
            const aprA = (a.apr24h ?? 0) + (a.emissionsApr ?? 0);
            const aprB = (b.apr24h ?? 0) + (b.emissionsApr ?? 0);
            return aprB - aprA;
          })[0];
          if (!topPool) return null;
          const topApr = (topPool.apr24h ?? 0) + (topPool.emissionsApr ?? 0);
          if (topApr <= 0) return null;
          return (
            <div className="glass-card rounded-3xl p-4 mb-6 flex items-center justify-between animate-fade-in-up border border-arc-400/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-arc-400/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-arc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">High Yield Alert</p>
                  <p className="text-xs text-on-surface-variant">
                    {topPool.token0.symbol}/{topPool.token1.symbol} on {topPool.protocolName} is yielding{" "}
                    <span className="text-arc-400 font-mono font-bold">{formatPercent(topApr)} APR</span>
                    {topPool.tvlUsd != null && <> with {formatUsd(topPool.tvlUsd)} TVL</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDepositUrl(topPool)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs px-4 py-2 rounded-lg"
                >
                  Explore
                </a>
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="text-on-surface-variant hover:text-on-surface p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Layout Grid: Filter Panel + Data Table ── */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* ── Left: Filter Panel (3 cols on desktop) ── */}

          {/* Mobile filter overlay */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-surface-container-low overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="font-extrabold text-sm tracking-widest uppercase text-on-surface"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Filters
                  </span>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <X className="w-5 h-5 text-on-surface-variant" />
                  </button>
                </div>
                <PoolsSidebar
                  selectedChains={selectedChains}
                  selectedProtocols={selectedProtocols}
                  onToggleChain={handleToggleChain}
                  onToggleProtocol={handleToggleProtocol}
                  onClearAll={clearAllFilters}
                  tvlRange={tvlRange}
                  onTvlRangeChange={handleTvlRangeChange}
                  boostedOnly={boostedOnly}
                  onBoostedToggle={() => setBoostedOnly((b) => !b)}
                />
              </div>
            </div>
          )}

          {/* Desktop filter panel */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-24">
              <PoolsSidebar
                selectedChains={selectedChains}
                selectedProtocols={selectedProtocols}
                onToggleChain={handleToggleChain}
                onToggleProtocol={handleToggleProtocol}
                onClearAll={clearAllFilters}
                tvlRange={tvlRange}
                onTvlRangeChange={handleTvlRangeChange}
                boostedOnly={boostedOnly}
                onBoostedToggle={() => setBoostedOnly((b) => !b)}
              />
            </div>
          </aside>

          {/* ── Right: Data Table (9 cols on desktop) ── */}
          <div className="col-span-12 lg:col-span-9">
            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-high/50">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        Pair
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:table-cell">
                        Protocol
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden md:table-cell">
                        Chain
                      </th>
                      <th
                        className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-arc-400 transition-colors select-none"
                        onClick={() => handleSort("tvlUsd")}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          TVL <SortIcon field="tvlUsd" />
                        </span>
                      </th>
                      <th
                        className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-arc-400 transition-colors select-none hidden md:table-cell"
                        onClick={() => handleSort("volume24hUsd")}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          24h Vol <SortIcon field="volume24hUsd" />
                        </span>
                      </th>
                      <th
                        className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-arc-400 transition-colors select-none hidden lg:table-cell"
                        onClick={() => handleSort("fees24hUsd")}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          Fees <SortIcon field="fees24hUsd" />
                        </span>
                      </th>
                      <th
                        className="px-4 sm:px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-arc-400 transition-colors select-none"
                        onClick={() => handleSort("apr24h")}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          APR <SortIcon field="apr24h" />
                        </span>
                      </th>
                      <th className="px-4 sm:px-6 py-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={8} className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
                                <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
                              </div>
                              <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : pools.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center text-on-surface-variant">
                          No pools found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      pools.map((pool) => {
                        const feeApr = pool.apr24h ?? 0;
                        const emApr = pool.emissionsApr ?? 0;
                        const totalApr = feeApr + emApr;

                        return (
                          <tr
                            key={pool.poolAddress}
                            className="hover:bg-white/5 transition-colors group"
                          >
                            {/* PAIR — overlapping token circles + name */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-2 shrink-0">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-surface shadow-lg text-[10px] font-bold text-white"
                                    style={{ backgroundColor: getTokenColor(pool.token0.symbol) }}
                                  >
                                    {pool.token0.symbol.slice(0, 2)}
                                  </div>
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-surface shadow-lg text-[10px] font-bold text-white"
                                    style={{ backgroundColor: getTokenColor(pool.token1.symbol) }}
                                  >
                                    {pool.token1.symbol.slice(0, 2)}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-on-surface truncate">
                                    {pool.token0.symbol} / {pool.token1.symbol}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant/70 font-mono uppercase tracking-tight">
                                    {pool.feeTier != null && (
                                      <>{feeTierLabel(pool.feeTier)} Fee Tier</>
                                    )}
                                    {pool.poolType && !pool.feeTier && (
                                      <>{pool.poolType}</>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* PROTOCOL */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold border border-white/5">
                                <span className={`w-1.5 h-1.5 rounded-full ${PROTOCOL_DOT[pool.protocol] ?? "bg-slate-400"}`} />
                                {pool.protocolName}
                              </span>
                            </td>

                            {/* CHAIN */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 hidden md:table-cell">
                              <span className="text-xs text-on-surface-variant">
                                {CHAIN_LABELS[pool.chainId] ?? pool.chainId}
                              </span>
                            </td>

                            {/* TVL */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono text-sm tracking-tight text-on-surface tabular-nums">
                              {formatUsd(pool.tvlUsd)}
                            </td>

                            {/* 24H VOL */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono text-sm tracking-tight text-on-surface-variant tabular-nums hidden md:table-cell">
                              {formatUsd(pool.volume24hUsd)}
                            </td>

                            {/* FEES */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono text-sm tracking-tight text-on-surface-variant tabular-nums hidden lg:table-cell">
                              {formatUsd(pool.fees24hUsd)}
                            </td>

                            {/* APR — accent teal, bold */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                              <span
                                className="font-mono font-bold text-base sm:text-lg text-arc-400 tabular-nums"
                                title={
                                  emApr > 0
                                    ? `Fees: ${formatPercent(pool.apr24h)} + Emissions: ${formatPercent(pool.emissionsApr)}`
                                    : undefined
                                }
                              >
                                {formatPercent(totalApr || null)}
                                {emApr > 0 && (
                                  <span className="text-purple-400/60 text-xs ml-0.5">*</span>
                                )}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                              <a
                                href={getDepositUrl(pool)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-on-surface-variant hover:text-arc-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Open in protocol"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {pagination.totalPages > 1 && (
                <div className="p-4 sm:p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span
                    className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest"
                  >
                    Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of{" "}
                    {pagination.total.toLocaleString()} Pools
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Previous */}
                    <button
                      disabled={page <= 1 || refetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-arc-400 hover:text-arc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((p, idx) =>
                      p === "..." ? (
                        <span key={`dots-${idx}`} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-on-surface-variant text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          disabled={refetching}
                          className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                            p === pagination.page
                              ? "bg-arc-400 text-surface"
                              : "border border-white/10 text-on-surface-variant hover:border-arc-400 hover:text-arc-400"
                          } disabled:opacity-50`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      disabled={page >= pagination.totalPages || refetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-arc-400 hover:text-arc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Last synced */}
            {pools[0]?.lastSyncedAt && (
              <p className="text-[11px] text-on-surface-variant/50 mt-3 text-right font-mono">
                Last synced: {new Date(pools[0].lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
