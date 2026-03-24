"use client";

// ─────────────────────────────────────────
// PoolsSidebar — Kinetic Vault inline filter panel
// Fetches available chains/protocols from /api/pools/facets
// so only entries with actual pool data are shown.
// ─────────────────────────────────────────

import { useEffect, useState } from "react";

// Display metadata for chains — keyed by chainId
const CHAIN_META: Record<string, { label: string; dotColor: string }> = {
  base:      { label: "Base",      dotColor: "bg-arc-400" },
  optimism:  { label: "Optimism",  dotColor: "bg-red-400" },
  ethereum:  { label: "Ethereum",  dotColor: "bg-blue-400" },
  arbitrum:  { label: "Arbitrum",  dotColor: "bg-sky-400" },
  polygon:   { label: "Polygon",   dotColor: "bg-purple-400" },
  solana:    { label: "Solana",    dotColor: "bg-violet-400" },
  bsc:       { label: "BNB Chain", dotColor: "bg-yellow-400" },
  avalanche: { label: "Avalanche", dotColor: "bg-red-500" },
};

// Display metadata for protocols — keyed by slug
const PROTOCOL_META: Record<string, { dotColor: string }> = {
  aerodrome:    { dotColor: "bg-blue-400" },
  velodrome:    { dotColor: "bg-red-400" },
  "uniswap-v3": { dotColor: "bg-pink-400" },
  raydium:      { dotColor: "bg-cyan-400" },
  orca:         { dotColor: "bg-amber-400" },
};

interface FacetsData {
  chains: string[];
  protocols: Array<{ slug: string; displayName: string; chainId: string }>;
}

interface RangeFilter {
  min: string;
  max: string;
}

interface PoolsSidebarProps {
  selectedChains: Set<string>;
  selectedProtocols: Set<string>;
  onToggleChain: (chain: string) => void;
  onToggleProtocol: (protocol: string) => void;
  onClearAll: () => void;
  // TVL range filter
  tvlRange: RangeFilter;
  onTvlRangeChange: (field: "min" | "max", value: string) => void;
  // Boosted APR toggle
  boostedOnly: boolean;
  onBoostedToggle: () => void;
}

export function PoolsSidebar({
  selectedChains,
  selectedProtocols,
  onToggleChain,
  onToggleProtocol,
  onClearAll,
  tvlRange,
  onTvlRangeChange,
  boostedOnly,
  onBoostedToggle,
}: PoolsSidebarProps) {
  const [facets, setFacets] = useState<FacetsData | null>(null);

  useEffect(() => {
    fetch("/api/pools/facets")
      .then((r) => r.json())
      .then(setFacets)
      .catch(() => {});
  }, []);

  const activeCount = selectedChains.size + selectedProtocols.size;

  if (!facets) {
    // Skeleton while loading
    return (
      <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6 animate-pulse">
        <div className="h-4 w-20 bg-surface-container-high rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 bg-surface-container-high rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/10 shadow-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-extrabold text-sm tracking-widest uppercase text-on-surface"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] text-arc-400 uppercase font-bold tracking-widest hover:text-arc-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Protocol Facet */}
      {facets.protocols.length > 0 && (
        <div className="mb-8">
          <label
            className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Protocol
          </label>
          <div className="space-y-2.5">
            {facets.protocols.map(({ slug, displayName }) => {
              const dotColor = PROTOCOL_META[slug]?.dotColor ?? "bg-slate-400";
              const active = selectedProtocols.has(slug);
              return (
                <label key={slug} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      active
                        ? "bg-arc-400 border-arc-400"
                        : "bg-surface-container-lowest border-outline-variant/30"
                    }`}
                    onClick={() => onToggleProtocol(slug)}
                  >
                    {active && (
                      <svg className="w-2.5 h-2.5 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span
                      className={`text-sm transition-colors ${
                        active ? "text-arc-400" : "text-on-surface/80 group-hover:text-arc-400"
                      }`}
                      onClick={() => onToggleProtocol(slug)}
                    >
                      {displayName}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Chain Facet */}
      {facets.chains.length > 0 && (
        <div className="mb-8">
          <label
            className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Chain
          </label>
          <div className="space-y-2.5">
            {facets.chains.map((chainId) => {
              const meta = CHAIN_META[chainId];
              const label = meta?.label ?? chainId.charAt(0).toUpperCase() + chainId.slice(1);
              const dotColor = meta?.dotColor ?? "bg-slate-400";
              const active = selectedChains.has(chainId);
              return (
                <label key={chainId} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      active
                        ? "bg-arc-400 border-arc-400"
                        : "bg-surface-container-lowest border-outline-variant/30"
                    }`}
                    onClick={() => onToggleChain(chainId)}
                  >
                    {active && (
                      <svg className="w-2.5 h-2.5 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span
                      className={`text-sm transition-colors ${
                        active ? "text-arc-400" : "text-on-surface/80 group-hover:text-arc-400"
                      }`}
                      onClick={() => onToggleChain(chainId)}
                    >
                      {label}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* TVL Range */}
      <div className="mb-8">
        <label
          className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          TVL Range
        </label>
        <div className="flex items-center gap-2">
          <div className="flex items-center flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg h-8 px-2.5">
            <span className="text-on-surface-variant/50 text-xs shrink-0 mr-1">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Min"
              value={tvlRange.min}
              onChange={(e) => onTvlRangeChange("min", e.target.value)}
              className="w-full bg-transparent text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none font-mono tabular-nums"
            />
          </div>
          <span className="text-on-surface-variant/40 text-xs">-</span>
          <div className="flex items-center flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg h-8 px-2.5">
            <span className="text-on-surface-variant/50 text-xs shrink-0 mr-1">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Max"
              value={tvlRange.max}
              onChange={(e) => onTvlRangeChange("max", e.target.value)}
              className="w-full bg-transparent text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none font-mono tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Boosted APR Toggle */}
      <div className="p-4 bg-arc-400/5 rounded-xl border border-arc-400/10 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-arc-400 tracking-tight">Boosted APR Only</span>
          <button
            onClick={onBoostedToggle}
            className={`w-10 h-5 rounded-full relative transition-all ${
              boostedOnly ? "bg-arc-400/40" : "bg-surface-container-high"
            }`}
          >
            <div
              className={`absolute top-1 w-3 h-3 rounded-full transition-all ${
                boostedOnly ? "left-6 bg-arc-400" : "left-1 bg-on-surface-variant/40"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Reset Filters Button */}
      {(activeCount > 0 || tvlRange.min || tvlRange.max || boostedOnly) && (
        <button
          onClick={onClearAll}
          className="w-full text-center text-xs text-on-surface-variant hover:text-arc-400 py-2.5 border border-outline-variant/20 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
