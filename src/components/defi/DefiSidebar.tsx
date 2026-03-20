"use client";

import { useMemo } from "react";
import type { DefiChain, DefiProtocol } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
}

// -- Component --------------------------------------------------------------

interface DefiSidebarProps {
  chains: DefiChain[];
  protocols: DefiProtocol[];
  selectedChain: string | null;
  onSelectChain: (chain: string | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export function DefiSidebar({
  chains,
  protocols,
  selectedChain,
  onSelectChain,
  selectedCategory,
  onSelectCategory,
}: DefiSidebarProps) {
  const topChains = chains.slice(0, 15);

  // Derive categories dynamically from protocol data so names always match
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of protocols) {
      if (p.category) {
        counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  }, [protocols]);

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
          {categories.map(({ name, count }) => {
            const active =
              selectedCategory?.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                onClick={() =>
                  onSelectCategory(active ? null : name)
                }
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                  active
                    ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="font-medium">{name}</span>
                <span
                  className="text-[10px] tabular-nums shrink-0 ml-2"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    color: active ? "rgba(0,229,196,0.6)" : "rgba(240,244,255,0.25)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
