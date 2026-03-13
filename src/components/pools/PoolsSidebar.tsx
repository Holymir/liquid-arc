"use client";

// ─────────────────────────────────────────
// PoolsSidebar — network & protocol sub-nav
// Fetches available chains/protocols from /api/pools/facets
// so only entries with actual pool data are shown.
// ─────────────────────────────────────────

import { useEffect, useState } from "react";

// Display metadata for chains — keyed by chainId
const CHAIN_META: Record<string, { label: string; dotColor: string }> = {
  base:     { label: "Base",     dotColor: "bg-arc-400" },
  optimism: { label: "Optimism", dotColor: "bg-red-400" },
  ethereum: { label: "Ethereum", dotColor: "bg-blue-400" },
  arbitrum: { label: "Arbitrum", dotColor: "bg-sky-400" },
  polygon:  { label: "Polygon",  dotColor: "bg-purple-400" },
  solana:   { label: "Solana",   dotColor: "bg-violet-400" },
  bsc:      { label: "BNB Chain", dotColor: "bg-yellow-400" },
  avalanche: { label: "Avalanche", dotColor: "bg-red-500" },
};

// Display metadata for protocols — keyed by slug
const PROTOCOL_META: Record<string, { dotColor: string }> = {
  aerodrome:   { dotColor: "bg-blue-400" },
  velodrome:   { dotColor: "bg-red-400" },
  "uniswap-v3": { dotColor: "bg-pink-400" },
  raydium:     { dotColor: "bg-cyan-400" },
  orca:        { dotColor: "bg-amber-400" },
};

interface FacetsData {
  chains: string[];
  protocols: Array<{ slug: string; displayName: string; chainId: string }>;
}

interface PoolsSidebarProps {
  selectedChains: Set<string>;
  selectedProtocols: Set<string>;
  onToggleChain: (chain: string) => void;
  onToggleProtocol: (protocol: string) => void;
  onClearAll: () => void;
}

export function PoolsSidebar({
  selectedChains,
  selectedProtocols,
  onToggleChain,
  onToggleProtocol,
  onClearAll,
}: PoolsSidebarProps) {
  const [facets, setFacets] = useState<FacetsData | null>(null);

  useEffect(() => {
    fetch("/api/pools/facets")
      .then((r) => r.json())
      .then(setFacets)
      .catch(() => {});
  }, []);

  const activeCount = selectedChains.size + selectedProtocols.size;

  // While loading, show nothing (sidebar is slim)
  if (!facets) return null;

  return (
    <div className="space-y-5">
      {/* Networks */}
      {facets.chains.length > 0 && (
        <div>
          <p
            className="px-1 mb-2.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Networks
          </p>
          <div className="space-y-0.5">
            {facets.chains.map((chainId) => {
              const meta = CHAIN_META[chainId];
              const label = meta?.label ?? chainId.charAt(0).toUpperCase() + chainId.slice(1);
              const dotColor = meta?.dotColor ?? "bg-slate-400";
              const active = selectedChains.has(chainId);
              return (
                <button
                  key={chainId}
                  onClick={() => onToggleChain(chainId)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-arc-400" : dotColor}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Protocols */}
      {facets.protocols.length > 0 && (
        <div>
          <p
            className="px-1 mb-2.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Protocols
          </p>
          <div className="space-y-0.5">
            {facets.protocols.map(({ slug, displayName }) => {
              const dotColor = PROTOCOL_META[slug]?.dotColor ?? "bg-slate-400";
              const active = selectedProtocols.has(slug);
              return (
                <button
                  key={slug}
                  onClick={() => onToggleProtocol(slug)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-arc-400" : dotColor}`} />
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={onClearAll}
          className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 py-2 transition-colors"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
}
