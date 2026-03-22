"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TvlChart } from "@/components/defi/TvlChart";
import { ProtocolTable } from "@/components/defi/ProtocolTable";
import { DefiSidebar } from "@/components/defi/DefiSidebar";
import { Loader2, TrendingUp, X } from "lucide-react";
import type { DefiOverviewResponse } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function fmt(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000)
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// -- Chain pills ------------------------------------------------------------

const TOP_CHAINS = [
  "Ethereum",
  "Solana",
  "BSC",
  "Base",
  "Tron",
  "Bitcoin",
  "Arbitrum",
  "Polygon",
  "Avalanche",
  "Optimism",
  "Sui",
  "Hyperliquid",
];

// -- Main -------------------------------------------------------------------

export default function DefiPage() {
  const [overview, setOverview] = useState<DefiOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

  const hasFetched = useRef(false);

  const fetchOverview = useCallback(async () => {
    if (hasFetched.current) {
      setRefetching(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedChain) params.set("chain", selectedChain);
      const res = await fetch(`/api/defi/overview?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DefiOverviewResponse = await res.json();
      setOverview(data);
      hasFetched.current = true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load DeFi data"
      );
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [selectedChain]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const tvlChange = overview?.tvlChange24h;
  const tvlUp = tvlChange != null && tvlChange >= 0;

  // Metrics for the inline ticker
  const metrics = [
    { label: "Stables Mcap", value: overview?.stablecoinMcap },
    { label: "DEX 24h", value: overview?.dexVolume24h },
    { label: "Perps 24h", value: overview?.perpsVolume24h },
  ];

  return (
    <AppLayout
      sidebarTitle="DeFi"
      sidebarSlot={
        <DefiSidebar
          protocols={overview?.protocols ?? []}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      }
    >
      <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4 h-full flex flex-col min-h-0">
        {/* ── ROW 1: Metrics ticker ── compact single line ────── */}
        <div
          className="flex items-center gap-4 flex-wrap mb-2.5 pb-2.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* TVL headline */}
          <div className="flex items-center gap-2.5 mr-2">
            {refetching && (
              <Loader2 className="w-3.5 h-3.5 text-arc-400 animate-spin" />
            )}
            {loading ? (
              <div className="h-7 w-32 bg-slate-800/40 rounded animate-pulse" />
            ) : (
              <>
                <span
                  className="text-[10px] uppercase tracking-[0.12em] font-medium"
                  style={{
                    color: "rgba(240,244,255,0.3)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  TVL
                </span>
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: "#f0f4ff",
                  }}
                >
                  {fmt(overview?.totalTvl)}
                </span>
                <span
                  className="flex items-center gap-0.5 text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: tvlUp ? "#34d399" : "#f87171",
                  }}
                >
                  <TrendingUp
                    className={`w-3 h-3 ${tvlUp ? "" : "rotate-180"}`}
                  />
                  {fmtPct(tvlChange)}
                </span>
              </>
            )}
          </div>

          {/* Separator */}
          <div
            className="w-px h-4 hidden sm:block"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {/* Secondary metrics */}
          {metrics.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="text-[9px] uppercase tracking-[0.1em]"
                style={{
                  color: "rgba(240,244,255,0.2)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                {label}
              </span>
              {loading ? (
                <div className="h-4 w-14 bg-slate-800/30 rounded animate-pulse" />
              ) : (
                <span
                  className="text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: "rgba(240,244,255,0.7)",
                  }}
                >
                  {fmt(value)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── ROW 2: Chain pills + active filters ──────────────── */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <button
              onClick={() => setSelectedChain(null)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                !selectedChain
                  ? "bg-arc-500/15 border-arc-500/30 text-arc-400"
                  : "bg-slate-800/30 border-slate-700/20 text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              All
            </button>
            {TOP_CHAINS.map((chain) => {
              const active =
                selectedChain?.toLowerCase() === chain.toLowerCase();
              return (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(active ? null : chain)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                    active
                      ? "bg-arc-500/15 border-arc-500/30 text-arc-400"
                      : "bg-slate-800/30 border-slate-700/20 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {chain}
                </button>
              );
            })}
          </div>

          {/* Active filter badges — inline after pills */}
          {(selectedChain || selectedCategory) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    background: "rgba(129,140,248,0.08)",
                    border: "1px solid rgba(129,140,248,0.2)",
                    color: "#818cf8",
                  }}
                >
                  {selectedCategory}
                  <X className="w-2.5 h-2.5 opacity-60" />
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedChain(null);
                  setSelectedCategory(null);
                }}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                clear
              </button>
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-2.5 mb-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* ── ROW 3: Chart + Table — side-by-side on desktop ─── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-3">
          {/* Left: TVL Chart */}
          <div className="min-h-0 xl:max-h-[calc(100vh-180px)] xl:overflow-hidden">
            <TvlChart
              data={overview?.historicalTvl ?? []}
              isLoading={loading}
            />
          </div>

          {/* Right: Protocol Table */}
          <div className="min-h-0 xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto scrollbar-hide">
            <ProtocolTable
              protocols={overview?.protocols ?? []}
              loading={loading}
              selectedChain={selectedChain}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
