"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
  if (corr > 0.7) return "text-green-400";
  if (corr > 0.3) return "text-yellow-400";
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

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("tvlUsd");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [minTvl, setMinTvl] = useState(10_000);
  const [page, setPage] = useState(1);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortDir,
        page: String(page),
        limit: "50",
        minTvl: String(minTvl),
      });
      if (search.trim()) params.set("token", search.trim());

      const res = await fetch(`/api/pools?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PoolsResponse = await res.json();
      setPools(data.pools);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pools");
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDir, page, minTvl, search]);

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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0a0a0f]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-100 font-bold text-lg tracking-tight hover:text-indigo-400 transition-colors">
            LiquidArk
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400 text-sm font-medium">Pools</span>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-lg px-3 py-1.5"
        >
          Dashboard
        </Link>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Title + Stats */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Pool Analytics</h1>
          <p className="text-sm text-slate-500">
            {pagination.total} pools across {" "}
            <span className="text-slate-400">Aerodrome</span>
            {" "} on Base
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search by token..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Min TVL filter */}
          <select
            value={minTvl}
            onChange={(e) => { setMinTvl(Number(e.target.value)); setPage(1); }}
            className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            <option value={0}>All TVL</option>
            <option value={1000}>TVL &gt; $1K</option>
            <option value={10000}>TVL &gt; $10K</option>
            <option value={100000}>TVL &gt; $100K</option>
            <option value={1000000}>TVL &gt; $1M</option>
          </select>

          {/* Sort (mobile) */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
            className="sm:hidden bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-left">
                  <th className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Pool</th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Protocol</th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("tvlUsd")}
                  >
                    TVL <SortIcon field="tvlUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("volume24hUsd")}
                  >
                    Vol 24h <SortIcon field="volume24hUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("fees24hUsd")}
                  >
                    Fees 24h <SortIcon field="fees24hUsd" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("apr24h")}
                  >
                    APR 24h <SortIcon field="apr24h" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden lg:table-cell"
                    onClick={() => handleSort("apr7d")}
                  >
                    APR 7d <SortIcon field="apr7d" />
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right hidden xl:table-cell">
                    Correlation
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-center w-20">
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/30">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="h-5 bg-slate-800/50 rounded animate-pulse" />
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
                      className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {pool.token0.symbol}/{pool.token1.symbol}
                          </span>
                          {pool.feeTier != null && (
                            <span className="text-[10px] text-slate-500 bg-slate-800/80 rounded px-1.5 py-0.5">
                              {feeTierLabel(pool.feeTier)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                        {pool.protocolName}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">
                        {formatUsd(pool.tvlUsd)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                        {formatUsd(pool.volume24hUsd)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                        {formatUsd(pool.fees24hUsd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span className={(pool.apr24h ?? 0) > 50 ? "text-green-400" : (pool.apr24h ?? 0) > 10 ? "text-emerald-400" : "text-slate-300"}>
                          {formatPercent(pool.apr24h)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs hidden lg:table-cell">
                        <span className={(pool.apr7d ?? 0) > 50 ? "text-green-400" : (pool.apr7d ?? 0) > 10 ? "text-emerald-400" : "text-slate-300"}>
                          {formatPercent(pool.apr7d)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs hidden xl:table-cell ${correlationColor(pool.pairCorrelation30d)}`}>
                        {correlationLabel(pool.pairCorrelation30d)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={`https://aerodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 rounded-md px-2.5 py-1 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Deposit
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3.5 8.5l5-5m0 0H4m4.5 0V8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} pools)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
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
