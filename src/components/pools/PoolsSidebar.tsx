"use client";

// ─────────────────────────────────────────
// PoolsSidebar — network & protocol sub-nav
// ─────────────────────────────────────────

const CHAINS = [
  { slug: "base",     label: "Base",     dotColor: "bg-arc-400" },
  { slug: "optimism", label: "Optimism", dotColor: "bg-red-400" },
  { slug: "ethereum", label: "Ethereum", dotColor: "bg-blue-400" },
  { slug: "arbitrum", label: "Arbitrum", dotColor: "bg-sky-400" },
  { slug: "polygon",  label: "Polygon",  dotColor: "bg-purple-400" },
  { slug: "solana",   label: "Solana",   dotColor: "bg-violet-400" },
];

const PROTOCOLS = [
  { slug: "aerodrome",  label: "Aerodrome",  dotColor: "bg-blue-400" },
  { slug: "velodrome",  label: "Velodrome",  dotColor: "bg-red-400" },
  { slug: "uniswap-v3", label: "Uniswap V3", dotColor: "bg-pink-400" },
  { slug: "raydium",    label: "Raydium",    dotColor: "bg-cyan-400" },
  { slug: "orca",       label: "Orca",       dotColor: "bg-amber-400" },
];

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
  const activeCount = selectedChains.size + selectedProtocols.size;

  return (
    <div className="space-y-5">
      {/* Networks */}
      <div>
        <p
          className="px-1 mb-2.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Networks
        </p>
        <div className="space-y-0.5">
          {CHAINS.map(({ slug, label, dotColor }) => {
            const active = selectedChains.has(slug);
            return (
              <button
                key={slug}
                onClick={() => onToggleChain(slug)}
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

      {/* Protocols */}
      <div>
        <p
          className="px-1 mb-2.5 text-[10px] uppercase tracking-widest text-slate-600 font-medium"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Protocols
        </p>
        <div className="space-y-0.5">
          {PROTOCOLS.map(({ slug, label, dotColor }) => {
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
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
