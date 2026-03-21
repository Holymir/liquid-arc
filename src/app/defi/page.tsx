"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TvlChart } from "@/components/defi/TvlChart";
import { ProtocolTable } from "@/components/defi/ProtocolTable";
import { DefiSidebar } from "@/components/defi/DefiSidebar";
import { Layers, Loader2 } from "lucide-react";
import type { DefiOverviewResponse } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pctColor(value: number | null | undefined): string {
  if (value == null) return "text-slate-500";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

const cardStyle = {
  background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
  border: "1px solid rgba(255,255,255,0.06)",
};

function WidgetSkeleton() {
  return (
    <div className="rounded-2xl p-5 h-36" style={cardStyle}>
      <div className="h-3 w-24 bg-slate-800/50 rounded animate-pulse mb-4" />
      <div className="h-8 w-32 bg-slate-800/40 rounded animate-pulse mb-3" />
      <div className="h-3 w-20 bg-slate-800/30 rounded animate-pulse" />
    </div>
  );
}

// -- Top chains for filter pills -------------------------------------------

const TOP_CHAIN_PILLS = [
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

// -- Main Component --------------------------------------------------------

export default function DefiPage() {
  const [overview, setOverview] = useState<DefiOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Failed to load DeFi data");
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [selectedChain]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* ── Page Header ──────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Layers className="w-5 h-5" style={{ color: "#00e5c4" }} />
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                color: "#f0f4ff",
              }}
            >
              DeFi Overview
            </h1>
            {refetching && <Loader2 className="w-4 h-4 text-arc-400 animate-spin" />}
          </div>
          <p className="text-sm" style={{ color: "rgba(240,244,255,0.35)" }}>
            Total Value Locked, protocol rankings, and key DeFi metrics
          </p>
        </div>

        {/* ── Chain Filter Pills ──────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          <button
            onClick={() => setSelectedChain(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              !selectedChain
                ? "bg-arc-500/15 border-arc-500/30 text-arc-400"
                : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            All
          </button>
          {TOP_CHAIN_PILLS.map((chain) => {
            const active = selectedChain?.toLowerCase() === chain.toLowerCase();
            return (
              <button
                key={chain}
                onClick={() => setSelectedChain(active ? null : chain)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  active
                    ? "bg-arc-500/15 border-arc-500/30 text-arc-400"
                    : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>

        {/* ── Error ───────────────────────────────── */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Key Metrics Grid ────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total TVL */}
          {loading ? (
            <WidgetSkeleton />
          ) : (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 100% 0%, rgba(0,229,196,0.06) 0%, transparent 70%)",
                }}
              />
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Total Value Locked
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {formatCompact(overview?.totalTvl)}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-medium ${pctColor(overview?.tvlChange24h)}`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatPct(overview?.tvlChange24h)}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(240,244,255,0.25)" }}>
                  24h
                </span>
              </div>
            </div>
          )}

          {/* Stablecoins Mcap */}
          {loading ? (
            <WidgetSkeleton />
          ) : (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Stablecoins Mcap
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {formatCompact(overview?.stablecoinMcap)}
              </div>
            </div>
          )}

          {/* DEX Volume 24h */}
          {loading ? (
            <WidgetSkeleton />
          ) : (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                DEXs Volume (24h)
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {formatCompact(overview?.dexVolume24h)}
              </div>
            </div>
          )}

          {/* Perps Volume 24h */}
          {loading ? (
            <WidgetSkeleton />
          ) : (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Perps Volume (24h)
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {formatCompact(overview?.perpsVolume24h)}
              </div>
            </div>
          )}
        </div>

        {/* ── TVL Chart ───────────────────────────── */}
        <div className="mb-6">
          <TvlChart
            data={overview?.historicalTvl ?? []}
            isLoading={loading}
          />
        </div>

        {/* ── Protocol Table ──────────────────────── */}
        <ProtocolTable
          protocols={overview?.protocols ?? []}
          loading={loading}
          selectedChain={selectedChain}
          selectedCategory={selectedCategory}
        />
      </div>
    </AppLayout>
  );
}
