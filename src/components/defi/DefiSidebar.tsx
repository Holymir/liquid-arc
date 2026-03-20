"use client";

import type { DefiChain } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
}

// -- Categories -------------------------------------------------------------

const CATEGORIES = [
  "Dexes",
  "Lending",
  "Bridge",
  "CDP",
  "Liquid Staking",
  "Yield",
  "Derivatives",
  "RWA",
  "DEX Aggregator",
  "Yield Aggregator",
  "Restaking",
  "Insurance",
];

// -- Component --------------------------------------------------------------

interface DefiSidebarProps {
  chains: DefiChain[];
  selectedChain: string | null;
  onSelectChain: (chain: string | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export function DefiSidebar({
  chains,
  selectedChain,
  onSelectChain,
  selectedCategory,
  onSelectCategory,
}: DefiSidebarProps) {
  const topChains = chains.slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Chains Section */}
      <div>
        <p
          className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Top Chains
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => onSelectChain(null)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
              !selectedChain
                ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <span className="font-medium">All Chains</span>
          </button>
          {topChains.map((chain) => {
            const active =
              selectedChain?.toLowerCase() === chain.name.toLowerCase();
            return (
              <button
                key={chain.name}
                onClick={() =>
                  onSelectChain(active ? null : chain.name)
                }
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                  active
                    ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="font-medium truncate">{chain.name}</span>
                <span
                  className="text-[10px] tabular-nums shrink-0 ml-2"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: active ? "rgba(0,229,196,0.6)" : "rgba(240,244,255,0.25)",
                  }}
                >
                  {formatCompact(chain.tvl)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <p
          className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Categories
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center px-2.5 py-2 rounded-lg text-xs transition-all ${
              !selectedCategory
                ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <span className="font-medium">All Categories</span>
          </button>
          {CATEGORIES.map((cat) => {
            const active =
              selectedCategory?.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() =>
                  onSelectCategory(active ? null : cat)
                }
                className={`w-full flex items-center px-2.5 py-2 rounded-lg text-xs transition-all ${
                  active
                    ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="font-medium">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
