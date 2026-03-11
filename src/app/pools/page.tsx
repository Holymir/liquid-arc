"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Loader2,
  EyeOff,
  Eye,
} from "lucide-react";

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

const FILTER_COLUMNS: {
  key: string;
  label: string;
  prefix: string;
  suffix: string;
}[] = [
  { key: "tvlUsd", label: "TVL", prefix: "$", suffix: "" },
  { key: "volume24hUsd", label: "Volume 24h", prefix: "$", suffix: "" },
  { key: "fees24hUsd", label: "Fees 24h", prefix: "$", suffix: "" },
  { key: "apr24h", label: "APR 24h", prefix: "", suffix: "%" },
  { key: "apr7d", label: "APR 7d", prefix: "", suffix: "%" },
  { key: "pairCorrelation30d", label: "Correlation", prefix: "", suffix: "" },
];

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
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
  const [filterInputs, setFilterInputs] =
    useState<Record<string, RangeFilter>>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<Record<string, RangeFilter>>(emptyFilters);

  // Debounce filter inputs
  const filterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  useEffect(() => {
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      setAppliedFilters(filterInputs);
      setPage(1);
    }, 600);
    return () => clearTimeout(filterTimer.current);
  }, [filterInputs]);

  const activeFilterCount = Object.values(appliedFilters).filter(
    (f) => f.min || f.max
  ).length;

  const clearAllFilters = () => {
    const empty = emptyFilters();
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const updateFilter = (key: string, field: "min" | "max", value: string) => {
    // Allow only numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setFilterInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
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
    if (sortBy !== field)
      return <span className="ml-1" style={{ color: "var(--text-dim)" }}>&#8597;</span>;
    return (
      <span className="text-arc-400 ml-1">
        {sortDir === "desc" ? "\u2193" : "\u2191"}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-syne)",
                color: "var(--text-primary)",
              }}
            >
              Pool Analytics
            </h1>

            {/* Pool count badge */}
            {pagination.total > 0 && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums"
                style={{
                  background: "rgba(15,23,42,0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(15,23,42,0.07)",
                }}
              >
                {pagination.total.toLocaleString()}
              </span>
            )}

            {/* Live badge */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: "rgba(59,130,246,0.08)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.18)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full pulse-live"
                style={{ background: "#3b82f6", display: "inline-block" }}
              />
              Live
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Concentrated liquidity pools on Base &middot; Aerodrome
          </p>
        </div>

        {/* ── Filters bar ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search by token…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none transition-all"
              style={{
                background: "var(--surface-1)",
                border: "1px solid rgba(15,23,42,0.07)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59,130,246,0.07)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(15,23,42,0.07)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              filtersOpen || activeFilterCount > 0
                ? {
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.28)",
                    color: "#3b82f6",
                  }
                : {
                    background: "var(--surface-1)",
                    border: "1px solid rgba(15,23,42,0.07)",
                    color: "var(--text-secondary)",
                  }
            }
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{
                  background: "rgba(59,130,246,0.18)",
                  color: "#3b82f6",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <X className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}

          {/* Hide empty toggle */}
          <button
            onClick={() => {
              setHideEmpty((h) => !h);
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={
              hideEmpty
                ? {
                    background: "var(--surface-1)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    color: "var(--text-secondary)",
                  }
                : {
                    background: "transparent",
                    border: "1px solid rgba(15,23,42,0.05)",
                    color: "var(--text-muted)",
                  }
            }
            title={
              hideEmpty
                ? "Showing active pools only"
                : "Showing all pools including empty"
            }
          >
            {hideEmpty ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline text-xs">
              {hideEmpty ? "Hide empty" : "Show all"}
            </span>
          </button>

          {/* Refetch spinner */}
          {refetching && (
            <Loader2 className="w-4 h-4 text-arc-400 animate-spin" />
          )}

          {/* Mobile sort select */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortField);
              setPage(1);
            }}
            className="sm:hidden rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface-1)",
              border: "1px solid rgba(15,23,42,0.07)",
              color: "var(--text-secondary)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Filter panel ─────────────────────────────────────────── */}
        {filtersOpen && (
          <div className="e-card rounded-xl p-5 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FILTER_COLUMNS.map((col) => (
                <div key={col.key}>
                  <label className="stat-label block mb-2">{col.label}</label>
                  <div className="flex items-center gap-2">
                    {/* Min input */}
                    <div className="relative flex-1">
                      {col.prefix && (
                        <span
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {col.prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Min"
                        value={filterInputs[col.key]?.min ?? ""}
                        onChange={(e) =>
                          updateFilter(col.key, "min", e.target.value)
                        }
                        className={`w-full ${col.prefix ? "pl-6" : "pl-3"} ${
                          col.suffix ? "pr-6" : "pr-3"
                        } py-1.5 rounded-lg text-xs font-mono tabular-nums focus:outline-none transition-all`}
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid rgba(15,23,42,0.07)",
                          color: "var(--text-primary)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(59,130,246,0.30)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(15,23,42,0.07)";
                        }}
                      />
                      {col.suffix && (
                        <span
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {col.suffix}
                        </span>
                      )}
                    </div>

                    <span style={{ color: "var(--text-dim)", fontSize: "12px" }}>
                      &ndash;
                    </span>

                    {/* Max input */}
                    <div className="relative flex-1">
                      {col.prefix && (
                        <span
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {col.prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Max"
                        value={filterInputs[col.key]?.max ?? ""}
                        onChange={(e) =>
                          updateFilter(col.key, "max", e.target.value)
                        }
                        className={`w-full ${col.prefix ? "pl-6" : "pl-3"} ${
                          col.suffix ? "pr-6" : "pr-3"
                        } py-1.5 rounded-lg text-xs font-mono tabular-nums focus:outline-none transition-all`}
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid rgba(15,23,42,0.07)",
                          color: "var(--text-primary)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(59,130,246,0.30)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(15,23,42,0.07)";
                        }}
                      />
                      {col.suffix && (
                        <span
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {col.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.15)",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="w-8 text-left">#</th>
                  <th className="text-left">Pool</th>
                  <th className="text-left hidden sm:table-cell">Protocol</th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("tvlUsd")}
                  >
                    TVL <SortIcon field="tvlUsd" />
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("volume24hUsd")}
                  >
                    Vol 24h <SortIcon field="volume24hUsd" />
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("fees24hUsd")}
                  >
                    Fees 24h <SortIcon field="fees24hUsd" />
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("apr24h")}
                  >
                    APR 24h <SortIcon field="apr24h" />
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden lg:table-cell"
                    onClick={() => handleSort("apr7d")}
                  >
                    APR 7d <SortIcon field="apr7d" />
                  </th>
                  <th className="text-right hidden xl:table-cell">
                    Correlation
                  </th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10}>
                        <div
                          className="h-5 rounded animate-pulse"
                          style={{ background: "rgba(15,23,42,0.04)" }}
                        />
                      </td>
                    </tr>
                  ))
                ) : pools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No pools found
                    </td>
                  </tr>
                ) : (
                  pools.map((pool, idx) => (
                    <tr key={pool.poolAddress} className="hover:bg-white/[0.025]">
                      <td
                        className="tabular-nums text-xs"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {pool.token0.symbol}/{pool.token1.symbol}
                          </span>
                          {pool.feeTier != null && (
                            <span
                              className="text-[10px] rounded-md px-1.5 py-0.5 font-mono"
                              style={{
                                background: "rgba(15,23,42,0.04)",
                                border: "1px solid rgba(15,23,42,0.07)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {feeTierLabel(pool.feeTier)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="text-xs hidden sm:table-cell"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {pool.protocolName}
                      </td>
                      <td
                        className="text-right font-mono text-xs tabular-nums"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatUsd(pool.tvlUsd)}
                      </td>
                      <td
                        className="text-right font-mono text-xs tabular-nums hidden md:table-cell"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatUsd(pool.volume24hUsd)}
                      </td>
                      <td
                        className="text-right font-mono text-xs tabular-nums hidden md:table-cell"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatUsd(pool.fees24hUsd)}
                      </td>
                      <td className="text-right font-mono text-xs tabular-nums">
                        <span
                          className={
                            (pool.apr24h ?? 0) > 50
                              ? "text-emerald-400"
                              : (pool.apr24h ?? 0) > 10
                              ? "text-emerald-400/80"
                              : ""
                          }
                          style={
                            (pool.apr24h ?? 0) <= 10
                              ? { color: "var(--text-secondary)" }
                              : {}
                          }
                        >
                          {formatPercent(pool.apr24h)}
                        </span>
                      </td>
                      <td className="text-right font-mono text-xs tabular-nums hidden lg:table-cell">
                        <span
                          className={
                            (pool.apr7d ?? 0) > 50
                              ? "text-emerald-400"
                              : (pool.apr7d ?? 0) > 10
                              ? "text-emerald-400/80"
                              : ""
                          }
                          style={
                            (pool.apr7d ?? 0) <= 10
                              ? { color: "var(--text-secondary)" }
                              : {}
                          }
                        >
                          {formatPercent(pool.apr7d)}
                        </span>
                      </td>
                      <td
                        className={`text-right font-mono text-xs tabular-nums hidden xl:table-cell ${correlationColor(
                          pool.pairCorrelation30d
                        )}`}
                      >
                        {correlationLabel(pool.pairCorrelation30d)}
                      </td>
                      <td className="text-center">
                        <a
                          href={`https://aerodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary inline-flex items-center gap-1 text-xs px-3 py-1.5"
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

          {/* ── Pagination ─────────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
            >
              <button
                disabled={page <= 1 || refetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Page {pagination.page} of {pagination.totalPages}
                <span
                  className="hidden sm:inline"
                  style={{ color: "var(--text-dim)" }}
                >
                  {" "}
                  &middot; {pagination.total} pools
                </span>
              </span>

              <button
                disabled={page >= pagination.totalPages || refetching}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Last synced ──────────────────────────────────────────── */}
        {pools[0]?.lastSyncedAt && (
          <p
            className="text-[11px] mt-3 text-right"
            style={{ color: "var(--text-dim)" }}
          >
            Last synced:{" "}
            {new Date(pools[0].lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
