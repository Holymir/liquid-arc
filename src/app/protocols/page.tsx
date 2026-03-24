"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Shield, Check } from "lucide-react";
import { PROTOCOLS, type ProtocolEntry } from "@/data/protocols";

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; color: string }
> = {
  dex:            { label: "DEX",            color: "#3b82f6" },
  lending:        { label: "Lending",        color: "#a78bfa" },
  yield:          { label: "Yield",          color: "#f59e0b" },
  "liquid-staking": { label: "Liquid Staking", color: "#06b6d4" },
  bridge:         { label: "Bridge",         color: "#ec4899" },
  derivatives:    { label: "Derivatives",    color: "#f97316" },
  staking:        { label: "Staking",        color: "#10b981" },
};

const TABS: { value: string; label: string }[] = [
  { value: "all",            label: "All" },
  { value: "dex",            label: "DEX" },
  { value: "lending",        label: "Lending" },
  { value: "yield",          label: "Yield" },
  { value: "liquid-staking", label: "Liquid Staking" },
  { value: "bridge",         label: "Bridges" },
  { value: "derivatives",    label: "Derivatives" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function riskDot(level: ProtocolEntry["riskLevel"]) {
  const colors: Record<string, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#ef4444",
  };
  return colors[level] ?? "#94a3b8";
}

function uniqueChains(): number {
  const all = new Set<string>();
  PROTOCOLS.forEach((p) => p.chains.forEach((c) => all.add(c)));
  return all.size;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProtocolsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce search
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer.current);
  }, [searchInput]);

  // Filter
  const filtered = PROTOCOLS.filter((p) => {
    if (activeTab !== "all" && p.category !== activeTab) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const trackedCount = PROTOCOLS.filter((p) => p.supportedByLiquidArc).length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">

        {/* ── Hero ──────────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
            }}
          >
            Trusted Protocols
          </h1>
          <p className="text-sm leading-relaxed max-w-xl text-on-surface-variant/60">
            Curated directory of battle-tested DeFi protocols across chains.
          </p>
        </div>

        {/* ── Stats row ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6">
          {[
            { value: String(PROTOCOLS.length), label: "Protocols" },
            { value: String(uniqueChains()), label: "Chains" },
            { value: `${trackedCount} tracked`, label: "by LiquidArc" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span
                className="text-lg font-bold text-on-surface"
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                }}
              >
                {value}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Category tabs ─────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-arc-500/10 text-arc-400 border border-arc-500/30"
                  : "text-on-surface-variant hover:text-on-surface border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search ────────────────────────────────── */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            type="text"
            placeholder="Search protocols..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm text-on-surface placeholder-[#475569] focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
          />
        </div>

        {/* ── Cards grid ────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#94a3b8] text-sm">
            No protocols found
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((protocol) => (
              <ProtocolCard key={protocol.slug} protocol={protocol} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Protocol Card ────────────────────────────────────────────────────────────

function ProtocolCard({ protocol }: { protocol: ProtocolEntry }) {
  const cat = CATEGORY_META[protocol.category];

  return (
    <Link href={`/protocols/${protocol.slug}`}>
      <div className="group glass-card rounded-2xl p-5 h-full transition-all duration-300 cursor-pointer hover:border-outline-variant/30">
        {/* Row 1: name + category badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3
            className="text-base font-bold truncate text-on-surface"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
            }}
          >
            {protocol.name}
          </h3>
          <span
            className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
            style={{
              background: `${cat?.color ?? "#94a3b8"}18`,
              color: cat?.color ?? "#94a3b8",
              border: `1px solid ${cat?.color ?? "#94a3b8"}30`,
            }}
          >
            {cat?.label ?? protocol.category}
          </span>
        </div>

        {/* Row 2: chain badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {protocol.chains.slice(0, 4).map((chain) => (
            <span
              key={chain}
              className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-mono capitalize bg-surface-container-high border border-outline-variant/20 text-on-surface-variant"
            >
              {chain}
            </span>
          ))}
          {protocol.chains.length > 4 && (
            <span className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-surface-container-high border border-outline-variant/20 text-[#94a3b8]">
              +{protocol.chains.length - 4}
            </span>
          )}
        </div>

        {/* Row 3: risk + audit + supported */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Risk dot */}
          <span className="inline-flex items-center gap-1.5 text-[10px] text-on-surface-variant/60">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: riskDot(protocol.riskLevel) }}
            />
            {protocol.riskLevel} risk
          </span>

          {/* Audit status */}
          {protocol.audited ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant/50">
              <Shield className="w-3 h-3" style={{ color: "#22c55e" }} />
              {protocol.auditors.length > 0 ? protocol.auditors[0] : "Audited"}
              {protocol.auditors.length > 1 && ` +${protocol.auditors.length - 1}`}
            </span>
          ) : (
            <span className="text-[10px] text-[#475569]">
              Unaudited
            </span>
          )}

          {/* Supported badge */}
          {protocol.supportedByLiquidArc && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: "rgba(0,229,196,0.1)",
                border: "1px solid rgba(0,229,196,0.25)",
                color: "#00e5c4",
              }}
            >
              <Check className="w-2.5 h-2.5" />
              Supported
            </span>
          )}
        </div>

        {/* Row 4: description */}
        <p className="text-xs leading-relaxed line-clamp-2 text-on-surface-variant/50">
          {protocol.description}
        </p>
      </div>
    </Link>
  );
}
