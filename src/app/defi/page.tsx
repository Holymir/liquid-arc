"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TvlChart } from "@/components/defi/TvlChart";
import { TvlSparkline } from "@/components/defi/TvlSparkline";
import { ProtocolTable } from "@/components/defi/ProtocolTable";
import { DefiSidebar } from "@/components/defi/DefiSidebar";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  X,
} from "lucide-react";
import type { DefiOverviewResponse } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000)
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// -- Chain pills ------------------------------------------------------------

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [chartExpanded, setChartExpanded] = useState(false);

  const hasFetched = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Scroll to the protocol table when filters change
  const prevChain = useRef(selectedChain);
  const prevCategory = useRef(selectedCategory);
  useEffect(() => {
    if (
      prevChain.current !== selectedChain ||
      prevCategory.current !== selectedCategory
    ) {
      prevChain.current = selectedChain;
      prevCategory.current = selectedCategory;
      // Small delay so the table can re-render first
      requestAnimationFrame(() => {
        tableRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }, [selectedChain, selectedCategory]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* ═══════════════════════════════════════════════════════
            HERO STRIP — TVL headline + sparkline + 3 mini metrics
            All in one compact row. Replaces the old 4-card grid.
           ═══════════════════════════════════════════════════════ */}
        <div className="mb-4 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-stretch">
            {/* ── TVL Card with embedded sparkline ──────────── */}
            <div
              className="rounded-2xl relative overflow-hidden flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(145deg, rgba(10,22,40,0.85), rgba(6,14,28,0.65))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Ambient glow */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,229,196,0.07) 0%, transparent 65%)",
                }}
              />
              <div className="relative z-10 px-5 pt-4 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <Activity
                    className="w-3.5 h-3.5"
                    style={{ color: "#00e5c4" }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-[0.15em] font-medium"
                    style={{
                      color: "rgba(240,244,255,0.35)",
                      fontFamily: "var(--font-geist-mono)",
                    }}
                  >
                    Total Value Locked
                  </span>
                  {refetching && (
                    <Loader2 className="w-3 h-3 text-arc-400 animate-spin ml-auto" />
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  {loading ? (
                    <div className="h-9 w-40 bg-slate-800/40 rounded animate-pulse" />
                  ) : (
                    <>
                      <span
                        className="text-3xl sm:text-4xl font-bold tracking-tight"
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          color: "#f0f4ff",
                        }}
                      >
                        {formatCompact(overview?.totalTvl)}
                      </span>
                      <span
                        className="flex items-center gap-1 text-sm font-semibold"
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          color: tvlUp ? "#34d399" : "#f87171",
                        }}
                      >
                        {tvlUp ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 rotate-180" />
                        )}
                        {formatPct(tvlChange)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Sparkline at bottom of card */}
              <div className="h-16 w-full opacity-80">
                {!loading && (
                  <TvlSparkline
                    data={overview?.historicalTvl ?? []}
                    height={64}
                  />
                )}
              </div>
            </div>

            {/* ── 3 Mini Metric Cards ─────────────────────── */}
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:w-48">
              {[
                {
                  label: "Stablecoins",
                  value: overview?.stablecoinMcap,
                  delay: "stagger-1",
                },
                {
                  label: "DEX Vol 24h",
                  value: overview?.dexVolume24h,
                  delay: "stagger-2",
                },
                {
                  label: "Perps 24h",
                  value: overview?.perpsVolume24h,
                  delay: "stagger-3",
                },
              ].map(({ label, value, delay }) => (
                <div
                  key={label}
                  className={`rounded-xl px-3.5 py-3 animate-fade-in-up ${delay}`}
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(10,22,40,0.7), rgba(6,14,28,0.5))",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="text-[9px] uppercase tracking-[0.15em] mb-1.5"
                    style={{
                      color: "rgba(240,244,255,0.3)",
                      fontFamily: "var(--font-geist-mono)",
                    }}
                  >
                    {label}
                  </div>
                  {loading ? (
                    <div className="h-5 w-16 bg-slate-800/40 rounded animate-pulse" />
                  ) : (
                    <div
                      className="text-base font-bold"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color: "#f0f4ff",
                      }}
                    >
                      {formatCompact(value)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            CHAIN FILTER PILLS
           ═══════════════════════════════════════════════════════ */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          <button
            onClick={() => setSelectedChain(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
              !selectedChain
                ? "bg-arc-500/15 border-arc-500/30 text-arc-400"
                : "bg-slate-800/30 border-slate-700/20 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}
          >
            All
          </button>
          {TOP_CHAIN_PILLS.map((chain) => {
            const active =
              selectedChain?.toLowerCase() === chain.toLowerCase();
            return (
              <button
                key={chain}
                onClick={() => setSelectedChain(active ? null : chain)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
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

        {/* ═══════════════════════════════════════════════════════
            ACTIVE FILTER BADGES — visual feedback for active filters
           ═══════════════════════════════════════════════════════ */}
        {(selectedChain || selectedCategory) && (
          <div className="flex items-center gap-2 mb-3 animate-fade-in-up">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{
                color: "rgba(240,244,255,0.25)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Filters
            </span>
            {selectedChain && (
              <button
                onClick={() => setSelectedChain(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: "rgba(0,229,196,0.08)",
                  border: "1px solid rgba(0,229,196,0.2)",
                  color: "#00e5c4",
                }}
              >
                {selectedChain}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: "rgba(129,140,248,0.08)",
                  border: "1px solid rgba(129,140,248,0.2)",
                  color: "#818cf8",
                }}
              >
                {selectedCategory}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
            <button
              onClick={() => {
                setSelectedChain(null);
                setSelectedCategory(null);
              }}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ERROR BANNER
           ═══════════════════════════════════════════════════════ */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            EXPANDABLE TVL CHART — collapsed by default, toggle open
           ═══════════════════════════════════════════════════════ */}
        <button
          onClick={() => setChartExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 mb-3 rounded-xl text-xs transition-all"
          style={{
            background: chartExpanded
              ? "linear-gradient(145deg, rgba(10,22,40,0.6), rgba(6,14,28,0.4))"
              : "rgba(10,22,40,0.3)",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "rgba(240,244,255,0.4)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Historical TVL Chart
          </span>
          {chartExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: chartExpanded ? "500px" : "0px",
            opacity: chartExpanded ? 1 : 0,
            marginBottom: chartExpanded ? "12px" : "0px",
          }}
        >
          <TvlChart
            data={overview?.historicalTvl ?? []}
            isLoading={loading}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            PROTOCOL TABLE — hero element, visible above the fold
           ═══════════════════════════════════════════════════════ */}
        <div ref={tableRef}>
          <ProtocolTable
            protocols={overview?.protocols ?? []}
            loading={loading}
            selectedChain={selectedChain}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
    </AppLayout>
  );
}
