"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { DefiProtocol } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function fmt(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000)
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pctColor(value: number | null | undefined): string {
  if (value == null) return "text-slate-600";
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

  const sorted = useMemo(() => {
    const dir = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return (Number(av) - Number(bv)) * dir;
    });
  }, [filtered, sortBy, sortDir]);

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
    if (sortBy !== field)
      return <span className="text-slate-700 ml-0.5">&#8597;</span>;
    return (
      <span className="text-arc-400 ml-0.5">
        {sortDir === "desc" ? "\u2193" : "\u2191"}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar — compact */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
          />
        </div>
        <span
          className="text-[10px] shrink-0"
          style={{
            color: "rgba(240,244,255,0.3)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {sorted.length}
        </span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800/40 text-left">
                <th className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest w-6">
                  #
                </th>
                <th className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest">
                  Name
                </th>
                <th className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest hidden lg:table-cell">
                  Category
                </th>
                <th
                  className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                  onClick={() => handleSort("tvl")}
                >
                  TVL
                  <SortIcon field="tvl" />
                </th>
                <th
                  className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                  onClick={() => handleSort("change1d")}
                >
                  1d
                  <SortIcon field="change1d" />
                </th>
                <th
                  className="px-2.5 py-2 text-slate-500 font-medium text-[9px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden sm:table-cell"
                  onClick={() => handleSort("change7d")}
                >
                  7d
                  <SortIcon field="change7d" />
                </th>
                <th className="px-2.5 py-2 w-6" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/20">
                    <td colSpan={7} className="px-2.5 py-2">
                      <div className="h-4 bg-slate-800/30 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2.5 py-8 text-center text-slate-500 text-xs"
                  >
                    No protocols found
                  </td>
                </tr>
              ) : (
                paginated.map((protocol, idx) => (
                  <tr
                    key={protocol.slug}
                    className="border-b border-slate-800/15 hover:bg-slate-800/15 transition-colors"
                  >
                    <td
                      className="px-2.5 py-1.5 text-slate-600 tabular-nums"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "10px",
                      }}
                    >
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-2">
                        {protocol.logo && (
                          <Image
                            src={protocol.logo}
                            alt={protocol.name}
                            width={18}
                            height={18}
                            className="rounded-full shrink-0"
                            unoptimized
                          />
                        )}
                        <span className="font-medium text-slate-200 truncate max-w-[120px]">
                          {protocol.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 hidden lg:table-cell">
                      <span
                        className="text-slate-500 truncate max-w-[80px] inline-block"
                        style={{ fontSize: "10px" }}
                      >
                        {protocol.category}
                      </span>
                    </td>
                    <td
                      className="px-2.5 py-1.5 text-right text-slate-300 tabular-nums"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "11px",
                      }}
                    >
                      {fmt(protocol.tvl)}
                    </td>
                    <td
                      className={`px-2.5 py-1.5 text-right tabular-nums ${pctColor(protocol.change1d)}`}
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "11px",
                      }}
                    >
                      {fmtPct(protocol.change1d)}
                    </td>
                    <td
                      className={`px-2.5 py-1.5 text-right tabular-nums hidden sm:table-cell ${pctColor(protocol.change7d)}`}
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "11px",
                      }}
                    >
                      {fmtPct(protocol.change7d)}
                    </td>
                    <td className="px-2.5 py-1.5 text-center">
                      {protocol.url && (
                        <a
                          href={protocol.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-arc-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
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
          <div className="flex items-center justify-between px-2.5 py-2 border-t border-slate-800/40 shrink-0">
            <span
              className="text-[10px] text-slate-600"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {page}/{totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-md border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-2.5 h-2.5" />
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-md border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
