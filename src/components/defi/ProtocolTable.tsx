"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { DefiProtocol } from "@/lib/defi/defillama-types";

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

// -- Types ------------------------------------------------------------------

type SortField = "tvl" | "change1d" | "change7d" | "mcap";

// -- Component --------------------------------------------------------------

interface ProtocolTableProps {
  protocols: DefiProtocol[];
  loading: boolean;
  selectedChain: string | null;
  selectedCategory: string | null;
}

const PER_PAGE = 50;

export function ProtocolTable({
  protocols,
  loading,
  selectedChain,
  selectedCategory,
}: ProtocolTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("tvl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Filter by chain + category + search (all client-side for proper crossfiltering)
  const filtered = useMemo(() => {
    let result = protocols;
    if (selectedChain) {
      const chainLower = selectedChain.toLowerCase();
      result = result.filter(
        (p) =>
          p.chain.toLowerCase() === chainLower ||
          p.chains.some((c) => c.toLowerCase() === chainLower)
      );
    }
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.chain.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [protocols, selectedChain, selectedCategory, searchInput]);

  // Sort
  const sorted = useMemo(() => {
    const dir = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return (Number(av) - Number(bv)) * dir;
    });
  }, [filtered, sortBy, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
    return (
      <span className="text-arc-400 ml-1">
        {sortDir === "desc" ? "\u2193" : "\u2191"}
      </span>
    );
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search protocols..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
          />
        </div>
        <span
          className="text-xs"
          style={{
            color: "rgba(240,244,255,0.35)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {sorted.length} protocol{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40 text-left">
                <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest w-8">
                  #
                </th>
                <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest">
                  Name
                </th>
                <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest hidden sm:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest hidden md:table-cell">
                  Chain
                </th>
                <th
                  className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                  onClick={() => handleSort("tvl")}
                >
                  TVL <SortIcon field="tvl" />
                </th>
                <th
                  className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                  onClick={() => handleSort("change1d")}
                >
                  1d % <SortIcon field="change1d" />
                </th>
                <th
                  className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                  onClick={() => handleSort("change7d")}
                >
                  7d % <SortIcon field="change7d" />
                </th>
                <th
                  className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden lg:table-cell"
                  onClick={() => handleSort("mcap")}
                >
                  Mcap <SortIcon field="mcap" />
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/20">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-5 bg-slate-800/30 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No protocols found
                  </td>
                </tr>
              ) : (
                paginated.map((protocol, idx) => (
                  <tr
                    key={protocol.slug}
                    className="border-b border-slate-800/20 hover:bg-slate-800/15 transition-colors"
                  >
                    <td
                      className="px-4 py-3 text-slate-600 text-xs tabular-nums"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {protocol.logo && (
                          <Image
                            src={protocol.logo}
                            alt={protocol.name}
                            width={24}
                            height={24}
                            className="rounded-full shrink-0"
                            unoptimized
                          />
                        )}
                        <span className="font-medium text-slate-200">
                          {protocol.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[10px] text-slate-400 bg-slate-800/50 border border-slate-700/30 rounded-md px-1.5 py-0.5">
                        {protocol.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                      {protocol.chains.length > 3
                        ? `${protocol.chains.slice(0, 2).join(", ")} +${protocol.chains.length - 2}`
                        : protocol.chains.join(", ") || protocol.chain}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-slate-300 text-xs tabular-nums"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatCompact(protocol.tvl)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs tabular-nums ${pctColor(protocol.change1d)}`}
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPct(protocol.change1d)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs tabular-nums hidden md:table-cell ${pctColor(protocol.change7d)}`}
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPct(protocol.change7d)}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-slate-400 text-xs tabular-nums hidden lg:table-cell"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatCompact(protocol.mcap)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {protocol.url && (
                        <a
                          href={protocol.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-arc-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} ({sorted.length} protocols)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
