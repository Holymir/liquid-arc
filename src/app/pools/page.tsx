"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Search, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, X, Loader2, EyeOff, Eye } from "lucide-react";

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
  const [hideEmpty, setHideEmpty] = useState(true);

  // Range filters state — debounced values used for API calls
  const emptyFilters = (): Record<string, RangeFilter> =>
    Object.fromEntries(FILTER_COLUMNS.map((c) => [c.key, { min: "", max: "" }]));
  const [filterInputs, setFilterInputs] = useState<Record<string, RangeFilter>>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, RangeFilter>>(emptyFilters);

  // Debounce filter inputs
  const filterTimer = useRef<ReturnType<typeof setTimeout>>();
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

  const updateFilter = (key: string, field: "min" | "max", value: string) => {
    // Allow only numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setFilterInputs((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

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
      if (hideEmpty) params.set("hideEmpty", "1");

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
  }, [sortBy, sortDir, page, search, appliedFilters, hideEmpty]);

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
    return <span className="text-indigo-400 ml-1">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Title + Stats */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1">Pool Analytics</h1>
          <p className="text-sm text-slate-500">
            {pagination.total} pools across{" "}
            <span className="text-slate-400">Aerodrome</span>
            {" "}on Base
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
              className="w-full pl-9 pr-3 py-2 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
              filtersOpen || activeFilterCount > 0
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-slate-800/30 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
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
              Clear all
            </button>
          )}

          <button
            onClick={() => { setHideEmpty((h) => !h); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
              hideEmpty
                ? "bg-slate-800/40 border-slate-700/40 text-slate-300"
                : "bg-slate-800/20 border-slate-700/30 text-slate-500"
            }`}
            title={hideEmpty ? "Showing active pools only" : "Showing all pools including empty"}
          >
            {hideEmpty ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-xs">{hideEmpty ? "Hide empty" : "Show all"}</span>
          </button>

          {refetching && (
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          )}

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
            className="sm:hidden bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
        </div>

        {/* Range filters panel */}
        {filtersOpen && (
          <div className="glass-card rounded-xl p-4 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FILTER_COLUMNS.map((col) => (
                <div key={col.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
                    {col.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      {col.prefix && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">{col.prefix}</span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Min"
                        value={filterInputs[col.key]?.min ?? ""}
                        onChange={(e) => updateFilter(col.key, "min", e.target.value)}
                        className={`w-full ${col.prefix ? "pl-6" : "pl-3"} ${col.suffix ? "pr-6" : "pr-3"} py-1.5 bg-slate-800/40 border border-slate-700/30 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/15 transition-all font-mono tabular-nums`}
                      />
                      {col.suffix && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">{col.suffix}</span>
                      )}
                    </div>
                    <span className="text-slate-600 text-xs">–</span>
                    <div className="relative flex-1">
                      {col.prefix && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">{col.prefix}</span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Max"
                        value={filterInputs[col.key]?.max ?? ""}
                        onChange={(e) => updateFilter(col.key, "max", e.target.value)}
                        className={`w-full ${col.prefix ? "pl-6" : "pl-3"} ${col.suffix ? "pr-6" : "pr-3"} py-1.5 bg-slate-800/40 border border-slate-700/30 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/15 transition-all font-mono tabular-nums`}
                      />
                      {col.suffix && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">{col.suffix}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                          {pool.feeTier != null && (
                            <span className="text-[10px] text-slate-500 bg-slate-800/40 border border-slate-700/30 rounded-md px-1.5 py-0.5">
                              {feeTierLabel(pool.feeTier)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                        {pool.protocolName}
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
                        <span className={(pool.apr24h ?? 0) > 50 ? "text-emerald-400" : (pool.apr24h ?? 0) > 10 ? "text-emerald-400/80" : "text-slate-300"}>
                          {formatPercent(pool.apr24h)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums hidden lg:table-cell">
                        <span className={(pool.apr7d ?? 0) > 50 ? "text-emerald-400" : (pool.apr7d ?? 0) > 10 ? "text-emerald-400/80" : "text-slate-300"}>
                          {formatPercent(pool.apr7d)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs tabular-nums hidden xl:table-cell ${correlationColor(pool.pairCorrelation30d)}`}>
                        {correlationLabel(pool.pairCorrelation30d)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={`https://aerodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg px-2.5 py-1 transition-all"
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
    </div>
  );
}
