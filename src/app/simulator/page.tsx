"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { runSimulation } from "@/lib/simulator/engine";
import type { SimulatorInput, SimulatorResult } from "@/lib/simulator/types";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function formatUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatPct(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

// ─────────────────────────────────────────────────────────
// Fee Tier Options
// ─────────────────────────────────────────────────────────

const FEE_TIERS = [
  { label: "0.01%", value: 0.0001 },
  { label: "0.05%", value: 0.0005 },
  { label: "0.30%", value: 0.003 },
  { label: "1.00%", value: 0.01 },
];

const TIMEFRAMES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "1Y", days: 365 },
];

// ─────────────────────────────────────────────────────────
// Glassmorphism card wrapper
// ─────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background:
          "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Price Range Bar
// ─────────────────────────────────────────────────────────

function PriceRangeBar({
  lower,
  upper,
  current,
}: {
  lower: number;
  upper: number;
  current: number;
}) {
  const rangeSpan = upper - lower;
  if (rangeSpan <= 0) return null;

  // Compute the bar extents with padding
  const padding = rangeSpan * 0.15;
  const barMin = lower - padding;
  const barMax = upper + padding;
  const barSpan = barMax - barMin;

  const leftPct = ((lower - barMin) / barSpan) * 100;
  const rightPct = ((barMax - upper) / barSpan) * 100;
  const cursorPct = Math.max(
    0,
    Math.min(100, ((current - barMin) / barSpan) * 100)
  );
  const inRange = current >= lower && current <= upper;

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-xs"
          style={{
            color: "rgba(240,244,255,0.3)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          ${lower.toLocaleString()} min
        </span>
        <span
          className="text-xs"
          style={{
            color: "rgba(240,244,255,0.3)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          ${upper.toLocaleString()} max
        </span>
      </div>
      <div
        className="relative h-9 rounded-xl overflow-hidden"
        style={{ background: "#060e1c" }}
      >
        {/* Liquidity zone */}
        <div
          className="absolute top-0 bottom-0 rounded-xl"
          style={{
            left: `${leftPct}%`,
            right: `${rightPct}%`,
            background:
              "linear-gradient(90deg, transparent, rgba(0,229,196,0.15) 20%, rgba(0,229,196,0.3) 50%, rgba(0,229,196,0.15) 80%, transparent)",
            border: "1px solid rgba(0, 229, 196, 0.3)",
          }}
        />
        {/* Current price cursor */}
        <div
          className="absolute top-1 bottom-1 w-px"
          style={{
            left: `${cursorPct}%`,
            background: inRange ? "#00e5c4" : "#ff6b8a",
            boxShadow: inRange
              ? "0 0 8px #00e5c4, 0 0 16px rgba(0,229,196,0.5)"
              : "0 0 8px #ff6b8a",
          }}
        />
        {/* Price label */}
        <div
          className="absolute top-1.5 px-1.5 py-0.5 rounded-md"
          style={{
            left: `${Math.min(cursorPct + 1, 85)}%`,
            background: inRange
              ? "rgba(0, 229, 196, 0.15)"
              : "rgba(255, 107, 138, 0.15)",
            border: inRange
              ? "1px solid rgba(0, 229, 196, 0.3)"
              : "1px solid rgba(255, 107, 138, 0.3)",
            color: inRange ? "#00e5c4" : "#ff6b8a",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "9px",
          }}
        >
          ${current.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Risk Badge
// ─────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const config = {
    low: { color: "#00e5c4", bg: "rgba(0,229,196,0.1)", label: "Low" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium" },
    high: { color: "#ff6b8a", bg: "rgba(255,107,138,0.1)", label: "High" },
  };
  const c = config[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: c.bg,
        border: `1px solid ${c.color}30`,
        color: c.color,
        fontFamily: "var(--font-geist-mono)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.color }}
      />
      {c.label} Risk
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Strategy Comparison Card
// ─────────────────────────────────────────────────────────

function StrategyCard({
  name,
  icon: Icon,
  finalValue,
  returnPct,
  isBest,
  accent,
  details,
}: {
  name: string;
  icon: React.ElementType;
  finalValue: number;
  returnPct: number;
  isBest: boolean;
  accent: string;
  details?: { label: string; value: string; color: string }[];
}) {
  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-300"
      style={{
        background:
          "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
        border: isBest
          ? `1px solid ${accent}40`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isBest ? `0 0 40px ${accent}10` : "none",
      }}
    >
      {isBest && (
        <div
          className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: accent,
            color: "#020910",
          }}
        >
          Best
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}25`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span
          className="text-sm font-semibold"
          style={{
            color: "#f0f4ff",
            fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
          }}
        >
          {name}
        </span>
      </div>

      <div
        className="text-2xl font-bold mb-1"
        style={{
          color: "#f0f4ff",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {formatUsd(finalValue)}
      </div>
      <div
        className="text-sm font-medium"
        style={{
          color: returnPct >= 0 ? "#00e5c4" : "#ff6b8a",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {formatPct(returnPct)}
      </div>

      {details && details.length > 0 && (
        <div
          className="mt-4 pt-3 space-y-1.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {details.map((d) => (
            <div
              key={d.label}
              className="flex justify-between items-center text-xs"
            >
              <span style={{ color: "rgba(240,244,255,0.4)" }}>{d.label}</span>
              <span
                style={{
                  color: d.color,
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                {d.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "#0a1628",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="text-xs mb-2"
        style={{
          color: "rgba(240,244,255,0.4)",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        Day {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span style={{ color: "rgba(240,244,255,0.6)" }}>{entry.name}</span>
          <span
            className="ml-auto font-medium"
            style={{
              color: "#f0f4ff",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function SimulatorPage() {
  // ── Input State ──
  const [token0, setToken0] = useState("ETH");
  const [token1, setToken1] = useState("USDC");
  const [investment, setInvestment] = useState("10000");
  const [currentPrice, setCurrentPrice] = useState("3200");
  const [priceLower, setPriceLower] = useState("2800");
  const [priceUpper, setPriceUpper] = useState("4200");
  const [feeTier, setFeeTier] = useState(0.003);
  const [dailyVolume, setDailyVolume] = useState("1000000");
  const [timeframeDays, setTimeframeDays] = useState(90);
  const [priceChangePct, setPriceChangePct] = useState(0);

  // ── Result State ──
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // ── Parsed Inputs ──
  const parsed = useMemo(
    () => ({
      investmentUsd: parseFloat(investment) || 0,
      currentPrice: parseFloat(currentPrice) || 0,
      priceLower: parseFloat(priceLower) || 0,
      priceUpper: parseFloat(priceUpper) || 0,
      dailyVolume: parseFloat(dailyVolume) || 0,
    }),
    [investment, currentPrice, priceLower, priceUpper, dailyVolume]
  );

  const isValid =
    parsed.investmentUsd > 0 &&
    parsed.currentPrice > 0 &&
    parsed.priceLower > 0 &&
    parsed.priceUpper > parsed.priceLower &&
    parsed.dailyVolume > 0;

  // ── Run Simulation ──
  function handleRun() {
    if (!isValid) return;
    const input: SimulatorInput = {
      token0Symbol: token0,
      token1Symbol: token1,
      investmentUsd: parsed.investmentUsd,
      priceLower: parsed.priceLower,
      priceUpper: parsed.priceUpper,
      currentPrice: parsed.currentPrice,
      feeTier,
      dailyVolume: parsed.dailyVolume,
      timeframeDays,
    };
    const res = runSimulation(input, priceChangePct);
    setResult(res);
    setHasRun(true);
  }

  // ── Real-time update when price sensitivity slider moves ──
  const liveResult = useMemo(() => {
    if (!hasRun || !isValid) return result;
    const input: SimulatorInput = {
      token0Symbol: token0,
      token1Symbol: token1,
      investmentUsd: parsed.investmentUsd,
      priceLower: parsed.priceLower,
      priceUpper: parsed.priceUpper,
      currentPrice: parsed.currentPrice,
      feeTier,
      dailyVolume: parsed.dailyVolume,
      timeframeDays,
    };
    return runSimulation(input, priceChangePct);
  }, [hasRun, isValid, token0, token1, parsed, feeTier, timeframeDays, priceChangePct, result]);

  // ── Best Strategy ──
  const bestStrategy = useMemo(() => {
    if (!liveResult) return null;
    const strategies = [
      { name: "lp", value: liveResult.lpNetValue },
      { name: "hodl", value: liveResult.hodlValue },
      { name: "lending", value: liveResult.lendingValue },
    ];
    return strategies.reduce((best, s) => (s.value > best.value ? s : best))
      .name;
  }, [liveResult]);

  // ── Concentration Factor (for display) ──
  const concentrationFactor = useMemo(() => {
    if (parsed.priceUpper <= parsed.priceLower || parsed.currentPrice <= 0)
      return 1;
    const rangeFactor = Math.sqrt(parsed.priceUpper / parsed.priceLower);
    const rangeWidth = parsed.priceUpper - parsed.priceLower;
    return Math.min(
      (parsed.currentPrice * rangeFactor) / rangeWidth,
      10
    );
  }, [parsed]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(0,229,196,0.07)",
              border: "1px solid rgba(0,229,196,0.18)",
            }}
          >
            <Calculator className="w-3.5 h-3.5" style={{ color: "#00e5c4" }} />
            <span
              className="text-xs tracking-widest uppercase"
              style={{
                color: "#00e5c4",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Yield Simulator
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{
              color: "#f0f4ff",
              fontFamily:
                "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            Simulate Your LP Returns
          </h1>
          <p
            className="text-sm max-w-xl"
            style={{ color: "rgba(240,244,255,0.45)" }}
          >
            Compare concentrated liquidity against HODL and lending strategies.
            Adjust parameters to find the optimal range for your position.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[420px,1fr] gap-6 xl:gap-8 items-start">
          {/* ── Left: Input Form ── */}
          <GlassCard className="lg:sticky lg:top-20">
            <div className="space-y-5">
              {/* Token Pair */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Token Pair
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={token0}
                    onChange={(e) => setToken0(e.target.value.toUpperCase())}
                    className="bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                    placeholder="ETH"
                  />
                  <input
                    type="text"
                    value={token1}
                    onChange={(e) => setToken1(e.target.value.toUpperCase())}
                    className="bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                    placeholder="USDC"
                  />
                </div>
              </div>

              {/* Investment Amount */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Investment Amount
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "rgba(240,244,255,0.25)" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={investment}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setInvestment(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                    placeholder="10000"
                  />
                </div>
              </div>

              {/* Current Price */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Current Price
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "rgba(240,244,255,0.25)" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentPrice}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setCurrentPrice(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                    placeholder="3200"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Price Range (Min / Max)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "rgba(240,244,255,0.25)" }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceLower}
                      onChange={(e) => {
                        if (/^\d*\.?\d*$/.test(e.target.value))
                          setPriceLower(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                      placeholder="2800"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "rgba(240,244,255,0.25)" }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceUpper}
                      onChange={(e) => {
                        if (/^\d*\.?\d*$/.test(e.target.value))
                          setPriceUpper(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                      placeholder="4200"
                    />
                  </div>
                </div>
                {/* Visual range bar */}
                {parsed.priceLower > 0 &&
                  parsed.priceUpper > parsed.priceLower &&
                  parsed.currentPrice > 0 && (
                    <PriceRangeBar
                      lower={parsed.priceLower}
                      upper={parsed.priceUpper}
                      current={parsed.currentPrice}
                    />
                  )}
              </div>

              {/* Fee Tier */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Fee Tier
                </label>
                <select
                  value={feeTier}
                  onChange={(e) => setFeeTier(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all appearance-none cursor-pointer"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {FEE_TIERS.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Pool Volume */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Daily Pool Volume
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "rgba(240,244,255,0.25)" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={dailyVolume}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setDailyVolume(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[rgba(0,229,196,0.5)] focus:ring-1 focus:ring-[rgba(0,229,196,0.2)] transition-all"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                    placeholder="1000000"
                  />
                </div>
              </div>

              {/* Time Period */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{
                    color: "rgba(240,244,255,0.35)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Time Period
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.days}
                      onClick={() => setTimeframeDays(tf.days)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background:
                          timeframeDays === tf.days
                            ? "rgba(0,229,196,0.15)"
                            : "rgba(255,255,255,0.03)",
                        border:
                          timeframeDays === tf.days
                            ? "1px solid rgba(0,229,196,0.35)"
                            : "1px solid rgba(255,255,255,0.06)",
                        color:
                          timeframeDays === tf.days
                            ? "#00e5c4"
                            : "rgba(240,244,255,0.45)",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={!isValid}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: isValid ? "#00e5c4" : "rgba(0,229,196,0.3)",
                  color: "#020910",
                  boxShadow: isValid
                    ? "0 0 28px rgba(0,229,196,0.4)"
                    : "none",
                }}
              >
                <Zap className="w-4 h-4" />
                Run Simulation
              </button>

              {!isValid && parsed.priceUpper <= parsed.priceLower && parsed.priceLower > 0 && (
                <p
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: "#ff6b8a" }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Max price must be greater than min price
                </p>
              )}
            </div>
          </GlassCard>

          {/* ── Right: Results ── */}
          <div className="space-y-6">
            {!hasRun ? (
              /* Empty state */
              <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(0,229,196,0.08)",
                    border: "1px solid rgba(0,229,196,0.15)",
                  }}
                >
                  <BarChart3
                    className="w-7 h-7"
                    style={{ color: "rgba(0,229,196,0.5)" }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{
                    color: "#f0f4ff",
                    fontFamily:
                      "var(--font-syne), var(--font-geist-sans), sans-serif",
                  }}
                >
                  Configure &amp; Simulate
                </h3>
                <p
                  className="text-sm max-w-sm"
                  style={{ color: "rgba(240,244,255,0.35)" }}
                >
                  Set your investment parameters on the left and hit &ldquo;Run
                  Simulation&rdquo; to compare LP, HODL, and lending strategies.
                </p>
              </GlassCard>
            ) : liveResult ? (
              <>
                {/* Strategy Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StrategyCard
                    name="LP Position"
                    icon={TrendingUp}
                    finalValue={liveResult.lpNetValue}
                    returnPct={liveResult.lpReturnPct}
                    isBest={bestStrategy === "lp"}
                    accent="#00e5c4"
                    details={[
                      {
                        label: "Fee Income",
                        value: `+${formatUsd(liveResult.lpFeeIncome)}`,
                        color: "#00e5c4",
                      },
                      {
                        label: "Impermanent Loss",
                        value: formatUsd(liveResult.impermanentLoss),
                        color: "#ff6b8a",
                      },
                      {
                        label: "Net P&L",
                        value: `${liveResult.lpNetValue - parsed.investmentUsd >= 0 ? "+" : ""}${formatUsd(liveResult.lpNetValue - parsed.investmentUsd)}`,
                        color:
                          liveResult.lpNetValue >= parsed.investmentUsd
                            ? "#00e5c4"
                            : "#ff6b8a",
                      },
                    ]}
                  />
                  <StrategyCard
                    name="HODL (50/50)"
                    icon={DollarSign}
                    finalValue={liveResult.hodlValue}
                    returnPct={liveResult.hodlReturnPct}
                    isBest={bestStrategy === "hodl"}
                    accent="#3b82f6"
                  />
                  <StrategyCard
                    name="Lending (5% APY)"
                    icon={Percent}
                    finalValue={liveResult.lendingValue}
                    returnPct={liveResult.lendingReturnPct}
                    isBest={bestStrategy === "lending"}
                    accent="#f59e0b"
                  />
                </div>

                {/* Projected Value Chart */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-5">
                    <h3
                      className="text-sm font-bold"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      Projected Value Over Time
                    </h3>
                    <div className="flex items-center gap-4">
                      {[
                        { label: "LP", color: "#00e5c4" },
                        { label: "HODL", color: "#3b82f6" },
                        { label: "Lending", color: "#f59e0b" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "rgba(240,244,255,0.5)" }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: s.color }}
                          />
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveResult.projectedValues}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="day"
                          stroke="rgba(240,244,255,0.2)"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${v}d`}
                        />
                        <YAxis
                          stroke="rgba(240,244,255,0.2)"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            `$${v.toLocaleString()}`
                          }
                          width={80}
                        />
                        <Tooltip
                          content={<ChartTooltip />}
                        />
                        <Area
                          type="monotone"
                          dataKey="lpValue"
                          stroke="#00e5c4"
                          fill="rgba(0,229,196,0.1)"
                          strokeWidth={2}
                          name="LP Position"
                          dot={false}
                          activeDot={{ r: 4, fill: "#00e5c4" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="hodlValue"
                          stroke="#3b82f6"
                          fill="rgba(59,130,246,0.05)"
                          strokeWidth={2}
                          name="HODL"
                          dot={false}
                          activeDot={{ r: 4, fill: "#3b82f6" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="lendingValue"
                          stroke="#f59e0b"
                          fill="rgba(245,158,11,0.05)"
                          strokeWidth={2}
                          name="Lending"
                          dot={false}
                          activeDot={{ r: 4, fill: "#f59e0b" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                {/* Price Sensitivity Slider */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-sm font-bold"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      Price Sensitivity
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background:
                          priceChangePct === 0
                            ? "rgba(255,255,255,0.04)"
                            : priceChangePct > 0
                            ? "rgba(0,229,196,0.1)"
                            : "rgba(255,107,138,0.1)",
                        color:
                          priceChangePct === 0
                            ? "rgba(240,244,255,0.5)"
                            : priceChangePct > 0
                            ? "#00e5c4"
                            : "#ff6b8a",
                        fontFamily: "var(--font-geist-mono)",
                        border:
                          priceChangePct === 0
                            ? "1px solid rgba(255,255,255,0.06)"
                            : priceChangePct > 0
                            ? "1px solid rgba(0,229,196,0.2)"
                            : "1px solid rgba(255,107,138,0.2)",
                      }}
                    >
                      {priceChangePct >= 0 ? "+" : ""}
                      {priceChangePct}% price change
                    </span>
                  </div>
                  <p
                    className="text-xs mb-4"
                    style={{ color: "rgba(240,244,255,0.35)" }}
                  >
                    What if {token0} price changes by the end of the period?
                    Drag the slider to see the impact on your returns.
                  </p>
                  <div className="relative">
                    <input
                      type="range"
                      min={-50}
                      max={100}
                      step={1}
                      value={priceChangePct}
                      onChange={(e) =>
                        setPriceChangePct(parseInt(e.target.value))
                      }
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ff6b8a 0%, rgba(255,255,255,0.15) ${
                          ((priceChangePct + 50) / 150) * 100
                        }%, rgba(255,255,255,0.08) 100%)`,
                        accentColor: "#00e5c4",
                      }}
                    />
                    <div className="flex justify-between mt-2">
                      <span
                        className="text-[10px]"
                        style={{
                          color: "rgba(240,244,255,0.25)",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        -50%
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: "rgba(240,244,255,0.25)",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        0%
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: "rgba(240,244,255,0.25)",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        +100%
                      </span>
                    </div>
                  </div>

                  {/* Impact summary */}
                  {priceChangePct !== 0 && (
                    <div
                      className="mt-4 pt-4 grid grid-cols-2 gap-3"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{
                            color: "rgba(240,244,255,0.3)",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          New IL
                        </div>
                        <div
                          className="text-sm font-bold"
                          style={{
                            color: "#ff6b8a",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          {formatUsd(liveResult.impermanentLoss)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{
                            color: "rgba(240,244,255,0.3)",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          New LP Value
                        </div>
                        <div
                          className="text-sm font-bold"
                          style={{
                            color:
                              liveResult.lpNetValue >= parsed.investmentUsd
                                ? "#00e5c4"
                                : "#ff6b8a",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          {formatUsd(liveResult.lpNetValue)}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Risk Assessment + Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risk Assessment */}
                  <GlassCard>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle
                        className="w-4 h-4"
                        style={{ color: "#f59e0b" }}
                      />
                      <h3
                        className="text-sm font-bold"
                        style={{
                          color: "#f0f4ff",
                          fontFamily:
                            "var(--font-syne), var(--font-geist-sans), sans-serif",
                        }}
                      >
                        Risk Assessment
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Risk Level */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(240,244,255,0.4)" }}
                        >
                          Risk Level
                        </span>
                        <RiskBadge level={liveResult.riskLevel} />
                      </div>

                      {/* Range Utilization */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs"
                            style={{ color: "rgba(240,244,255,0.4)" }}
                          >
                            Range Utilization
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: "#00e5c4",
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {liveResult.priceRangeUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(liveResult.priceRangeUtilization, 100)}%`,
                              background:
                                "linear-gradient(90deg, #00e5c4, rgba(0,229,196,0.6))",
                            }}
                          />
                        </div>
                      </div>

                      {/* Concentration Factor */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(240,244,255,0.4)" }}
                        >
                          Concentration Factor
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: "#f0f4ff",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          {concentrationFactor.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Key Metrics */}
                  <GlassCard>
                    <h3
                      className="text-sm font-bold mb-4"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Estimated APR",
                          value: formatPct(liveResult.lpApr),
                          icon: TrendingUp,
                          color:
                            liveResult.lpApr >= 0 ? "#00e5c4" : "#ff6b8a",
                        },
                        {
                          label: "Fee Income",
                          value: `+${formatUsd(liveResult.lpFeeIncome)}`,
                          icon: DollarSign,
                          color: "#00e5c4",
                        },
                        {
                          label: "Impermanent Loss",
                          value: formatUsd(liveResult.impermanentLoss),
                          icon: TrendingDown,
                          color: "#ff6b8a",
                        },
                        {
                          label: "Net Return",
                          value: formatPct(liveResult.lpReturnPct),
                          icon: BarChart3,
                          color:
                            liveResult.lpReturnPct >= 0
                              ? "#00e5c4"
                              : "#ff6b8a",
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="rounded-lg p-3"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <m.icon
                              className="w-3 h-3"
                              style={{ color: m.color }}
                            />
                            <span
                              className="text-[10px] uppercase tracking-widest"
                              style={{
                                color: "rgba(240,244,255,0.35)",
                                fontFamily: "var(--font-geist-mono)",
                              }}
                            >
                              {m.label}
                            </span>
                          </div>
                          <div
                            className="text-base font-bold"
                            style={{
                              color: m.color,
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Disclaimer */}
                <div
                  className="flex items-start gap-2.5 rounded-xl p-4"
                  style={{
                    background: "rgba(245,158,11,0.05)",
                    border: "1px solid rgba(245,158,11,0.12)",
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "#f59e0b" }}
                  />
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "rgba(240,244,255,0.4)" }}
                  >
                    This simulator provides estimates based on simplified models.
                    Actual returns depend on market conditions, gas costs, pool
                    composition, and other factors. Not financial advice.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
