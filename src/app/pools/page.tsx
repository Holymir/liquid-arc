"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PoolsSidebar } from "@/components/pools/PoolsSidebar";
import { Search, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, X, Loader2 } from "lucide-react";
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

function correlationColor(corr: number | null): string {
  if (corr == null) return "text-slate-500";
  if (corr > 0.7) return "text-emerald-400";
  if (corr > 0.3) return "text-amber-400";
  return "text-red-400";
}

function correlationLabel(corr: number | null): string {
  if (corr == null) return "-";
  return corr.toFixed(2);
}

// ── Component ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "tvlUsd", label: "TVL" },
  { value: "volume24hUsd", label: "Volume 24h" },
  { value: "fees24hUsd", label: "Fees 24h" },
  { value: "apr24h", label: "APR 24h" },
  { value: "apr7d", label: "APR 7d" },
];

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

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("tvlUsd");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(new Set());

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

  const activeFilterCount = Object.values(appliedFilters).filter((f) => f.min || f.max).length;

  const clearAllFilters = () => {
    const empty = emptyFilters();
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const clearFilter = (key: string) => {
    const cleared = { min: "", max: "" };
    setFilterInputs((prev) => ({ ...prev, [key]: cleared }));
    setAppliedFilters((prev) => ({ ...prev, [key]: cleared }));
  };

  const updateFilter = (key: string, field: "min" | "max", value: string) => {
    // Allow only numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setFilterInputs((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Build chip labels for active filters
  const activeFilterChips = FILTER_COLUMNS
    .filter((col) => appliedFilters[col.key]?.min || appliedFilters[col.key]?.max)
    .map((col) => {
      const f = appliedFilters[col.key];
      const p = col.prefix;
      const s = col.suffix;
      let label = col.label + ": ";
      if (f.min && f.max) label += `${p}${f.min}${s}–${p}${f.max}${s}`;
      else if (f.min) label += `>${p}${f.min}${s}`;
      else label += `<${p}${f.max}${s}`;
      return { key: col.key, label };
    });

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
  }, [sortBy, sortDir, page, search, appliedFilters, selectedChains, selectedProtocols]);

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
    if (sortBy !== field) return <span className="text-slate-700 ml-1">&#8597;</span>;
    return <span className="text-arc-400 ml-1">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>;
  };

  const handleToggleChain = (chain: string) => {
    setSelectedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chain)) next.delete(chain); else next.add(chain);
      return next;
    });
    setPage(1);
  };

  const handleToggleProtocol = (protocol: string) => {
    setSelectedProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(protocol)) next.delete(protocol); else next.add(protocol);
      return next;
    });
    setPage(1);
  };

  const handleClearChainProtocol = () => {
    setSelectedChains(new Set());
    setSelectedProtocols(new Set());
    setPage(1);
  };

  return (
    <AppLayout
      sidebarTitle="Filters"
      sidebarSlot={
        <PoolsSidebar
          selectedChains={selectedChains}
          selectedProtocols={selectedProtocols}
          onToggleChain={handleToggleChain}
          onToggleProtocol={handleToggleProtocol}
          onClearAll={handleClearChainProtocol}
        />
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Title + Stats */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1">Pool Analytics</h1>
          <p className="text-sm text-slate-500">
            {pagination.total} pools
            {selectedProtocols.size > 0 || selectedChains.size > 0
              ? ` across ${[...selectedProtocols].join(", ") || "all protocols"}${selectedChains.size > 0 ? ` on ${[...selectedChains].join(", ")}` : ""}`
              : " across all protocols"}
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search by token..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
            />
          </div>

          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
              filtersOpen || activeFilterCount > 0
                ? "bg-arc-500/10 border-arc-500/30 text-arc-400"
                : "bg-slate-800/30 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Ranges
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-arc-500/20 text-arc-300 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear ranges
            </button>
          )}

          {/* Active filter chips */}
          {activeFilterChips.slice(0, 3).map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-arc-500/8 border border-arc-500/20 text-arc-400"
            >
              {chip.label}
              <button onClick={() => clearFilter(chip.key)} className="hover:text-arc-300 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {activeFilterChips.length > 3 && (
            <span className="text-[10px] font-mono text-arc-500/60">+{activeFilterChips.length - 3} more</span>
          )}

          {refetching && (
            <Loader2 className="w-4 h-4 text-arc-400 animate-spin" />
          )}

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
            className="sm:hidden bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-arc-500/50 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
        </div>

        {/* Active chain/protocol chips (summary) */}
        {(selectedChains.size > 0 || selectedProtocols.size > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {[...selectedChains].map((chain) => (
              <span
                key={chain}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-arc-500/10 border border-arc-500/20 text-arc-400 capitalize"
              >
                {chain}
                <button onClick={() => handleToggleChain(chain)} className="hover:text-arc-300 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {[...selectedProtocols].map((protocol) => (
              <span
                key={protocol}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-arc-500/10 border border-arc-500/20 text-arc-400"
              >
                {protocol}
                <button onClick={() => handleToggleProtocol(protocol)} className="hover:text-arc-300 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Range filters panel — smooth slide */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            filtersOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-slate-900/40 border-t border-arc-500/20 rounded-b-xl px-4 py-3 mt-2 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
              {FILTER_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium w-20 shrink-0">
                    {col.label}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg h-7 px-2">
                      {col.prefix && <span className="text-slate-600 text-xs shrink-0">{col.prefix}</span>}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Min"
                        value={filterInputs[col.key]?.min ?? ""}
                        onChange={(e) => updateFilter(col.key, "min", e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono tabular-nums px-1"
                      />
                      {col.suffix && <span className="text-slate-600 text-xs shrink-0">{col.suffix}</span>}
                    </div>
                    <span className="text-slate-600 text-xs">–</span>
                    <div className="flex items-center flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg h-7 px-2">
                      {col.prefix && <span className="text-slate-600 text-xs shrink-0">{col.prefix}</span>}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Max"
                        value={filterInputs[col.key]?.max ?? ""}
                        onChange={(e) => updateFilter(col.key, "max", e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono tabular-nums px-1"
                      />
                      {col.suffix && <span className="text-slate-600 text-xs shrink-0">{col.suffix}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/40 text-left">
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest w-8">#</th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest">Pool</th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest hidden sm:table-cell">Protocol</th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("tvlUsd")}
                  >
                    TVL <SortIcon field="tvlUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("volume24hUsd")}
                  >
                    Vol 24h <SortIcon field="volume24hUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("fees24hUsd")}
                  >
                    Fees 24h <SortIcon field="fees24hUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("apr24h")}
                  >
                    APR 24h <SortIcon field="apr24h" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden lg:table-cell"
                    onClick={() => handleSort("apr7d")}
                  >
                    APR 7d <SortIcon field="apr7d" />
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right hidden xl:table-cell">
                    Correlation
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/20">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="h-5 bg-slate-800/30 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pools.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                      No pools found
                    </td>
                  </tr>
                ) : (
                  pools.map((pool, idx) => (
                    <tr
                      key={pool.poolAddress}
                      className="border-b border-slate-800/20 hover:bg-slate-800/15 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-600 text-xs tabular-nums">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {pool.token0.symbol}/{pool.token1.symbol}
                          </span>
                          {pool.poolType && (
                            <span className="text-[10px] text-slate-400 bg-slate-800/50 border border-slate-700/30 rounded-md px-1.5 py-0.5 uppercase">
                              {pool.poolType}
                            </span>
                          )}
                          {pool.feeTier != null && (
                            <span className="text-[10px] text-slate-500 bg-slate-800/40 border border-slate-700/30 rounded-md px-1.5 py-0.5">
                              {feeTierLabel(pool.feeTier)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            pool.protocol === "aerodrome" ? "bg-blue-400" :
                            pool.protocol === "velodrome" ? "bg-red-400" :
                            pool.protocol === "uniswap-v3" ? "bg-pink-400" :
                            pool.protocol === "raydium" ? "bg-cyan-400" :
                            pool.protocol === "orca" ? "bg-amber-400" : "bg-slate-400"
                          }`} />
                          {pool.protocolName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs tabular-nums">
                        {formatUsd(pool.tvlUsd)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs tabular-nums hidden md:table-cell">
                        {formatUsd(pool.volume24hUsd)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs tabular-nums hidden md:table-cell">
                        {formatUsd(pool.fees24hUsd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {(() => {
                          const feeApr = pool.apr24h ?? 0;
                          const emApr = pool.emissionsApr ?? 0;
                          const totalApr = feeApr + emApr;
                          return (
                            <span title={emApr > 0 ? `Fees: ${formatPercent(pool.apr24h)} + Emissions: ${formatPercent(pool.emissionsApr)}` : undefined}
                              className={totalApr > 50 ? "text-emerald-400" : totalApr > 10 ? "text-emerald-400/80" : "text-slate-300"}>
                              {formatPercent(totalApr || null)}
                              {emApr > 0 && <span className="text-purple-400/60 ml-0.5">*</span>}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums hidden lg:table-cell">
                        {(() => {
                          const feeApr = pool.apr7d ?? 0;
                          const emApr = pool.emissionsApr ?? 0;
                          const totalApr = feeApr + emApr;
                          return (
                            <span title={emApr > 0 ? `Fees: ${formatPercent(pool.apr7d)} + Emissions: ${formatPercent(pool.emissionsApr)}` : undefined}
                              className={totalApr > 50 ? "text-emerald-400" : totalApr > 10 ? "text-emerald-400/80" : "text-slate-300"}>
                              {formatPercent(totalApr || null)}
                              {emApr > 0 && <span className="text-purple-400/60 ml-0.5">*</span>}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs tabular-nums hidden xl:table-cell ${correlationColor(pool.pairCorrelation30d)}`}>
                        {correlationLabel(pool.pairCorrelation30d)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={getDepositUrl(pool)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-arc-400 hover:text-arc-300 border border-arc-500/20 hover:border-arc-500/40 rounded-lg px-2.5 py-1 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Deposit
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} pools)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || refetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
                <button
                  disabled={page >= pagination.totalPages || refetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Last synced */}
        {pools[0]?.lastSyncedAt && (
          <p className="text-[11px] text-slate-600 mt-3 text-right">
            Last synced: {new Date(pools[0].lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
