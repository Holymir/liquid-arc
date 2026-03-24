"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Search,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  DollarSign,
  Blocks,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHAIN_FILTERS = [
  "All Chains",
  "Ethereum",
  "Solana",
  "Base",
  "Optimism",
  "Arbitrum",
];

const GLOBAL_STATS = [
  {
    label: "Total Value Locked",
    value: "$84.29B",
    change: "+2.4%",
    positive: true,
    icon: Layers,
  },
  {
    label: "24H Volume",
    value: "$4.12B",
    change: "-1.8%",
    positive: false,
    icon: Activity,
  },
  {
    label: "Stablecoin Market Cap",
    value: "$142.1B",
    change: "+0.3%",
    positive: true,
    icon: DollarSign,
  },
  {
    label: "Active Protocols",
    value: "2,847",
    change: "+12",
    positive: true,
    icon: Blocks,
  },
];

const TVL_BY_ECOSYSTEM = [
  { name: "Ethereum", tvl: 54.2 },
  { name: "Solana", tvl: 12.8 },
  { name: "BSC", tvl: 8.4 },
  { name: "Base", tvl: 4.2 },
  { name: "Arbitrum", tvl: 3.8 },
  { name: "Optimism", tvl: 3.1 },
  { name: "Other", tvl: 14.5 },
];

const DOMINANCE_DATA = [
  { name: "Ethereum", value: 54.2, color: "#00e5c4" },
  { name: "Solana", value: 12.8, color: "#9945ff" },
  { name: "BSC", value: 8.4, color: "#f0b90b" },
  { name: "Base", value: 4.2, color: "#3b82f6" },
  { name: "Arbitrum", value: 3.8, color: "#28a0f0" },
  { name: "Other", value: 16.6, color: "#6b7280" },
];

interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  DEX: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  Lending: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.25)" },
  CDP: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  Staking: { bg: "rgba(168,85,247,0.12)", text: "#a855f7", border: "rgba(168,85,247,0.25)" },
  Restaking: { bg: "rgba(168,85,247,0.12)", text: "#a855f7", border: "rgba(168,85,247,0.25)" },
};

interface Protocol {
  rank: number;
  name: string;
  category: string;
  chain: string;
  tvl: string;
  change7d: string;
  changePositive: boolean;
  volume24h: string;
}

const PROTOCOLS: Protocol[] = [
  { rank: 1, name: "Lido", category: "Staking", chain: "Ethereum", tvl: "$14.2B", change7d: "+1.2%", changePositive: true, volume24h: "$42M" },
  { rank: 2, name: "Aave", category: "Lending", chain: "Multi-chain", tvl: "$12.8B", change7d: "-0.4%", changePositive: false, volume24h: "$890M" },
  { rank: 3, name: "Uniswap", category: "DEX", chain: "Multi-chain", tvl: "$5.2B", change7d: "+2.1%", changePositive: true, volume24h: "$1.8B" },
  { rank: 4, name: "MakerDAO", category: "CDP", chain: "Ethereum", tvl: "$4.9B", change7d: "-1.2%", changePositive: false, volume24h: "$120M" },
  { rank: 5, name: "Curve", category: "DEX", chain: "Multi-chain", tvl: "$3.8B", change7d: "+0.8%", changePositive: true, volume24h: "$340M" },
  { rank: 6, name: "EigenLayer", category: "Restaking", chain: "Ethereum", tvl: "$12.1B", change7d: "+3.6%", changePositive: true, volume24h: "N/A" },
  { rank: 7, name: "Jupiter", category: "DEX", chain: "Solana", tvl: "$2.1B", change7d: "+5.2%", changePositive: true, volume24h: "$890M" },
  { rank: 8, name: "Aerodrome", category: "DEX", chain: "Base", tvl: "$1.4B", change7d: "+4.1%", changePositive: true, volume24h: "$180M" },
  { rank: 9, name: "Velodrome", category: "DEX", chain: "Optimism", tvl: "$320M", change7d: "+1.8%", changePositive: true, volume24h: "$45M" },
  { rank: 10, name: "Raydium", category: "DEX", chain: "Solana", tvl: "$580M", change7d: "+2.4%", changePositive: true, volume24h: "$320M" },
];

// Protocol initial letters as icons
const PROTOCOL_INITIALS: Record<string, string> = {
  Lido: "Li",
  Aave: "Aa",
  Uniswap: "Un",
  MakerDAO: "Mk",
  Curve: "Cv",
  EigenLayer: "EL",
  Jupiter: "Ju",
  Aerodrome: "Ae",
  Velodrome: "Ve",
  Raydium: "Ry",
};

// ---------------------------------------------------------------------------
// Custom Tooltip for Bar Chart
// ---------------------------------------------------------------------------

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: "#131c26",
        border: "1px solid rgba(59,74,69,0.3)",
        color: "#dae3f1",
        fontFamily: "var(--font-geist-mono)",
      }}
    >
      <p className="font-bold">{payload[0].payload.name}</p>
      <p className="text-arc-400">{payload[0].value}%</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltip for Pie Chart
// ---------------------------------------------------------------------------

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: "#131c26",
        border: "1px solid rgba(59,74,69,0.3)",
        color: "#dae3f1",
        fontFamily: "var(--font-geist-mono)",
      }}
    >
      <p className="font-bold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.color }}>{payload[0].value}%</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DeFiPage() {
  const [activeChain, setActiveChain] = useState("All Chains");
  const [protocolSearch, setProtocolSearch] = useState("");

  const filteredProtocols = PROTOCOLS.filter((p) => {
    if (protocolSearch) {
      const q = protocolSearch.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeChain !== "All Chains") {
      if (p.chain !== activeChain && p.chain !== "Multi-chain") return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pb-20">
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <section className="py-10 md:py-12 relative">
          {/* Background glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-arc-400/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h1
              className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              DeFi Intelligence
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base max-w-lg">
              Real-time DeFi ecosystem metrics across all chains
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/* CHAIN FILTER PILLS                                              */}
        {/* ================================================================ */}
        <div className="mb-8 overflow-x-auto pb-4 flex items-center gap-3 scrollbar-none">
          {CHAIN_FILTERS.map((chain) => {
            const isActive = activeChain === chain;
            return (
              <button
                key={chain}
                onClick={() => setActiveChain(chain)}
                className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-arc-400 text-surface font-bold"
                    : "bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* GLOBAL STATS GRID                                               */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {GLOBAL_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {stat.label}
                  </span>
                  <Icon className="w-4 h-4 text-on-surface-variant/40" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span
                    className="text-xl font-bold text-on-surface"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      stat.positive ? "text-[#80ffc7]" : "text-[#ffb4ab]"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* CHARTS ROW: TVL by Ecosystem + Dominance Donut                  */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* ── TVL by Ecosystem Bar Chart ──────── */}
          <div className="lg:col-span-7">
            <div
              className="glass-card rounded-2xl p-6 h-full flex flex-col"
            >
              <h2
                className="text-lg font-extrabold text-on-surface mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                TVL by Ecosystem
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Share of total value locked by chain
              </p>

              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={TVL_BY_ECOSYSTEM}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00e5c4" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#00e5c4" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      type="number"
                      tick={{ fill: "#b9cac4", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#dae3f1", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      content={<BarTooltip />}
                      cursor={{ fill: "rgba(0,229,196,0.05)" }}
                    />
                    <Bar
                      dataKey="tvl"
                      fill="url(#barGradient)"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Dominance Donut Chart ──────── */}
          <div className="lg:col-span-5">
            <div
              className="glass-card rounded-2xl p-6 h-full flex flex-col"
            >
              <h2
                className="text-lg font-extrabold text-on-surface mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Ecosystem Dominance
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Market share distribution
              </p>

              <div className="flex-1 min-h-[260px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DOMINANCE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="80%"
                      dataKey="value"
                      stroke="none"
                      paddingAngle={2}
                    >
                      {DOMINANCE_DATA.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span
                      className="block text-2xl font-extrabold text-on-surface"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      ETH
                    </span>
                    <span
                      className="block text-sm text-arc-400 font-mono"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      54.2%
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                {DOMINANCE_DATA.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-[11px] text-on-surface-variant">
                      {item.name}
                    </span>
                    <span
                      className="text-[10px] font-mono text-on-surface-variant/60"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* PROTOCOL LEADERBOARD TABLE                                      */}
        {/* ================================================================ */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2
              className="text-xl font-extrabold text-on-surface"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Top Protocols
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={protocolSearch}
                onChange={(e) => setProtocolSearch(e.target.value)}
                placeholder="Search protocols..."
                className="bg-surface-container-lowest border-none text-xs rounded-full pl-10 pr-4 py-2 w-48 focus:ring-1 focus:ring-arc-400 transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-lowest/50">
                <tr>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    #Rank
                  </th>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Protocol
                  </th>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant hidden md:table-cell"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant text-right"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    TVL
                  </th>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant text-right hidden sm:table-cell"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    7D Change
                  </th>
                  <th
                    className="px-6 py-4 font-semibold text-[10px] uppercase tracking-widest text-on-surface-variant text-right hidden lg:table-cell"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    24H Volume
                  </th>
                  <th className="px-6 py-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filteredProtocols.map((protocol) => {
                  const catStyle = CATEGORY_STYLES[protocol.category];
                  return (
                    <tr
                      key={protocol.rank}
                      className="hover:bg-surface-container-high/40 transition-colors group"
                    >
                      {/* Rank */}
                      <td
                        className="px-6 py-4 text-on-surface-variant"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {String(protocol.rank).padStart(2, "0")}
                      </td>

                      {/* Protocol name + chain */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] group-hover:scale-110 transition-transform"
                            style={{
                              background: "rgba(0,229,196,0.1)",
                              border: "1px solid rgba(0,229,196,0.2)",
                              color: "#00e5c4",
                            }}
                          >
                            {PROTOCOL_INITIALS[protocol.name] ?? protocol.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">
                              {protocol.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-arc-400/60" />
                              {protocol.chain}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category badge */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                          style={{
                            background: catStyle?.bg ?? "rgba(107,114,128,0.12)",
                            color: catStyle?.text ?? "#6b7280",
                            border: `1px solid ${catStyle?.border ?? "rgba(107,114,128,0.25)"}`,
                          }}
                        >
                          {protocol.category}
                        </span>
                      </td>

                      {/* TVL */}
                      <td
                        className="px-6 py-4 text-right text-on-surface font-bold"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {protocol.tvl}
                      </td>

                      {/* 7D Change */}
                      <td
                        className={`px-6 py-4 text-right hidden sm:table-cell ${
                          protocol.changePositive ? "text-[#80ffc7]" : "text-[#ffb4ab]"
                        }`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {protocol.changePositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {protocol.change7d}
                        </span>
                      </td>

                      {/* 24H Volume */}
                      <td
                        className="px-6 py-4 text-right text-on-surface-variant hidden lg:table-cell"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {protocol.volume24h}
                      </td>

                      {/* Link */}
                      <td className="px-6 py-4 text-right">
                        <button className="text-on-surface-variant hover:text-arc-400 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredProtocols.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-on-surface-variant text-sm"
                    >
                      No protocols found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-6 bg-surface-container-lowest/30 flex justify-center">
            <span
              className="text-[10px] text-on-surface-variant/50 font-mono uppercase tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Showing {filteredProtocols.length} of {PROTOCOLS.length} protocols
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
