"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  BookmarkPlus,
  Download,
  Share2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { runSimulation } from "@/lib/simulator/engine";
import type { SimulatorInput, SimulatorResult } from "@/lib/simulator/types";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface SavedStrategy {
  id: string;
  title: string;
  pair: string;
  protocol: string;
  chainId: string;
  investment: number;
  priceLower: number;
  priceUpper: number;
  duration: number;
  riskLevel: string;
  projectedApr: number | null;
  projectedFees: number | null;
  projectedIL: number | null;
  netResult: number | null;
  createdAt: string;
}

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
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
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
        <span className="text-xs font-mono text-on-surface-variant/50">
          ${lower.toLocaleString()} min
        </span>
        <span className="text-xs font-mono text-on-surface-variant/50">
          ${upper.toLocaleString()} max
        </span>
      </div>
      <div
        className="relative h-9 rounded-xl overflow-hidden bg-surface-container-lowest"
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
    low: { color: "#80ffc7", bg: "rgba(128,255,199,0.1)", label: "Low" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium" },
    high: { color: "#ffb4ab", bg: "rgba(255,180,171,0.1)", label: "High" },
  };
  const c = config[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono"
      style={{
        background: c.bg,
        border: `1px solid ${c.color}30`,
        color: c.color,
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
      className="relative glass-card rounded-xl p-5 transition-all duration-300"
      style={{
        border: isBest
          ? `1px solid ${accent}40`
          : undefined,
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
          className="text-sm font-semibold text-on-surface"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
          }}
        >
          {name}
        </span>
      </div>

      <div className="text-2xl font-bold text-on-surface mb-1 font-mono">
        {formatUsd(finalValue)}
      </div>
      <div
        className="text-sm font-medium font-mono"
        style={{
          color: returnPct >= 0 ? "#80ffc7" : "#ffb4ab",
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
              <span className="text-on-surface-variant/60">{d.label}</span>
              <span
                className="font-mono"
                style={{ color: d.color }}
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
      className="glass-panel rounded-xl p-3"
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div className="text-xs mb-2 font-mono text-on-surface-variant/60">
        Day {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-on-surface-variant">{entry.name}</span>
          <span className="ml-auto font-medium font-mono text-on-surface">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Save Strategy Modal
// ─────────────────────────────────────────────────────────

function SaveStrategyModal({
  onSave,
  onClose,
  saving,
}: {
  onSave: (title: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="glass-panel rounded-2xl p-6 max-w-md w-full relative z-10"
        style={{
          boxShadow: "0 8px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg font-bold text-on-surface"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Save Strategy
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
          Strategy Name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My ETH/USDC Strategy"
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:border-arc-400/50 focus:ring-1 focus:ring-arc-400/20 transition-all font-mono mb-5"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) onSave(title.trim());
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2.5 text-sm flex-1"
          >
            Cancel
          </button>
          <button
            onClick={() => title.trim() && onSave(title.trim())}
            disabled={!title.trim() || saving}
            className="btn-primary px-5 py-2.5 text-sm flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Saved Strategy Card
// ─────────────────────────────────────────────────────────

function SavedStrategyCard({
  strategy,
  onDelete,
}: {
  strategy: SavedStrategy;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const riskLevel = (strategy.riskLevel || "medium") as "low" | "medium" | "high";

  return (
    <div className="glass-card rounded-2xl p-5 group relative transition-all duration-200 hover:border-outline-variant/20">
      {/* Delete button */}
      <div className="absolute top-3 right-3">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDelete(strategy.id)}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: "rgba(255,180,171,0.1)",
                border: "1px solid rgba(255,180,171,0.2)",
              }}
              title="Confirm delete"
            >
              <Check className="w-3.5 h-3.5" style={{ color: "#ffb4ab" }} />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-container-high transition-all"
            title="Delete strategy"
          >
            <Trash2
              className="w-3.5 h-3.5 text-on-surface-variant hover:text-[#ffb4ab] transition-colors"
            />
          </button>
        )}
      </div>

      {/* Title */}
      <h4
        className="text-sm font-bold text-on-surface mb-3 pr-10"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        {strategy.title}
      </h4>

      {/* Pair + Protocol */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface">
          {strategy.pair}
        </span>
        <span className="text-xs font-mono text-on-surface-variant/50">
          {strategy.protocol}
        </span>
      </div>

      {/* Projected APR */}
      {strategy.projectedApr != null && (
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1">
            Projected APR
          </div>
          <div
            className="text-lg font-bold font-mono"
            style={{
              color: strategy.projectedApr >= 0 ? "#80ffc7" : "#ffb4ab",
            }}
          >
            {formatPct(strategy.projectedApr)}
          </div>
        </div>
      )}

      {/* Risk + Date row */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <RiskBadge level={riskLevel} />
        <span className="text-[10px] font-mono text-on-surface-variant/40">
          {new Date(strategy.createdAt).toLocaleDateString()}
        </span>
      </div>
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

  // ── Save/Share State ──
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [shareNotification, setShareNotification] = useState(false);

  // ── Saved Strategies State ──
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);

  // ── Fetch saved strategies on mount ──
  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch("/api/strategies");
      if (res.ok) {
        const data = await res.json();
        setSavedStrategies(data.strategies || []);
      }
    } catch {
      // Not logged in or fetch failed — silent
    } finally {
      setLoadingStrategies(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

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

  // ── Save Strategy ──
  async function handleSave(title: string) {
    if (!liveResult) return;
    setSaving(true);
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          pair: `${token0}/${token1}`,
          protocol: "Concentrated Liquidity",
          chainId: "base",
          investment: parsed.investmentUsd,
          priceLower: parsed.priceLower,
          priceUpper: parsed.priceUpper,
          duration: timeframeDays,
          riskLevel: liveResult.riskLevel,
          projectedApr: liveResult.lpApr,
          projectedFees: liveResult.lpFeeIncome,
          projectedIL: liveResult.impermanentLoss,
          netResult: liveResult.lpNetValue,
          strategyConfig: {
            token0,
            token1,
            investment: parsed.investmentUsd,
            currentPrice: parsed.currentPrice,
            priceLower: parsed.priceLower,
            priceUpper: parsed.priceUpper,
            feeTier,
            dailyVolume: parsed.dailyVolume,
            timeframeDays,
            priceChangePct,
          },
        }),
      });

      if (res.ok) {
        setShowSaveModal(false);
        setSaveNotification("Strategy saved!");
        setTimeout(() => setSaveNotification(null), 3000);
        fetchStrategies();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveNotification(data.error || "Failed to save. Please sign in.");
        setTimeout(() => setSaveNotification(null), 4000);
      }
    } catch {
      setSaveNotification("Failed to save strategy");
      setTimeout(() => setSaveNotification(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete Strategy ──
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setSavedStrategies((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silent
    }
  }

  // ── Download Results ──
  function handleDownload() {
    if (!liveResult) return;
    const summary = {
      exportedAt: new Date().toISOString(),
      pair: `${token0}/${token1}`,
      protocol: "Concentrated Liquidity",
      parameters: {
        investment: parsed.investmentUsd,
        currentPrice: parsed.currentPrice,
        priceLower: parsed.priceLower,
        priceUpper: parsed.priceUpper,
        feeTier,
        dailyVolume: parsed.dailyVolume,
        timeframeDays,
        priceChangePct,
      },
      results: {
        lpNetValue: liveResult.lpNetValue,
        lpApr: liveResult.lpApr,
        lpReturnPct: liveResult.lpReturnPct,
        feeIncome: liveResult.lpFeeIncome,
        impermanentLoss: liveResult.impermanentLoss,
        hodlValue: liveResult.hodlValue,
        hodlReturnPct: liveResult.hodlReturnPct,
        lendingValue: liveResult.lendingValue,
        lendingReturnPct: liveResult.lendingReturnPct,
        riskLevel: liveResult.riskLevel,
        rangeUtilization: liveResult.priceRangeUtilization,
      },
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liquidarc-sim-${token0}-${token1}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Share / Copy ──
  async function handleShare() {
    if (!liveResult) return;

    const text = [
      `LiquidArc Simulation: ${token0}/${token1}`,
      `Investment: ${formatUsd(parsed.investmentUsd)}`,
      `Range: ${formatUsd(parsed.priceLower)} - ${formatUsd(parsed.priceUpper)}`,
      `Duration: ${timeframeDays} days`,
      ``,
      `LP Net Value: ${formatUsd(liveResult.lpNetValue)} (${formatPct(liveResult.lpReturnPct)})`,
      `Fee Income: ${formatUsd(liveResult.lpFeeIncome)}`,
      `Impermanent Loss: ${formatUsd(liveResult.impermanentLoss)}`,
      `APR: ${formatPct(liveResult.lpApr)}`,
      `Risk: ${liveResult.riskLevel}`,
      ``,
      `HODL Value: ${formatUsd(liveResult.hodlValue)} (${formatPct(liveResult.hodlReturnPct)})`,
      `Lending Value: ${formatUsd(liveResult.lendingValue)} (${formatPct(liveResult.lendingReturnPct)})`,
      ``,
      `Simulated with LiquidArc`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setShareNotification(true);
      setTimeout(() => setShareNotification(false), 2000);
    } catch {
      // Fallback: silent fail
    }
  }

  const inputClass = "w-full pl-9 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:border-arc-400/50 focus:ring-1 focus:ring-arc-400/20 transition-all font-mono";
  const inputPairClass = "bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-arc-400/50 focus:ring-1 focus:ring-arc-400/20 transition-all font-mono";

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />

      {/* Ambient glow */}
      <div
        className="fixed top-0 right-0 w-[60vw] h-[60vw] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(0,229,196,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(0,229,196,0.07)",
              border: "1px solid rgba(0,229,196,0.18)",
            }}
          >
            <Calculator className="w-3.5 h-3.5 text-arc-400" />
            <span className="text-xs tracking-widest uppercase font-mono text-arc-400">
              Yield Simulator
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-on-surface mb-2"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
            }}
          >
            Simulate Your LP Returns
          </h1>
          <p className="text-sm max-w-xl text-on-surface-variant/60">
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
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Token Pair
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={token0}
                    onChange={(e) => setToken0(e.target.value.toUpperCase())}
                    className={inputPairClass}
                    placeholder="ETH"
                  />
                  <input
                    type="text"
                    value={token1}
                    onChange={(e) => setToken1(e.target.value.toUpperCase())}
                    className={inputPairClass}
                    placeholder="USDC"
                  />
                </div>
              </div>

              {/* Investment Amount */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Investment Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={investment}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setInvestment(e.target.value);
                    }}
                    className={inputClass}
                    placeholder="10000"
                  />
                </div>
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Current Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentPrice}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setCurrentPrice(e.target.value);
                    }}
                    className={inputClass}
                    placeholder="3200"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Price Range (Min / Max)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceLower}
                      onChange={(e) => {
                        if (/^\d*\.?\d*$/.test(e.target.value))
                          setPriceLower(e.target.value);
                      }}
                      className={inputClass}
                      placeholder="2800"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceUpper}
                      onChange={(e) => {
                        if (/^\d*\.?\d*$/.test(e.target.value))
                          setPriceUpper(e.target.value);
                      }}
                      className={inputClass}
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
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Fee Tier
                </label>
                <select
                  value={feeTier}
                  onChange={(e) => setFeeTier(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:border-arc-400/50 focus:ring-1 focus:ring-arc-400/20 transition-all appearance-none cursor-pointer font-mono"
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
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Daily Pool Volume
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={dailyVolume}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value))
                        setDailyVolume(e.target.value);
                    }}
                    className={inputClass}
                    placeholder="1000000"
                  />
                </div>
              </div>

              {/* Time Period */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 text-on-surface-variant">
                  Time Period
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.days}
                      onClick={() => setTimeframeDays(tf.days)}
                      className={`py-2 rounded-lg text-xs font-medium font-mono transition-all ${
                        timeframeDays === tf.days
                          ? "bg-arc-400/15 border border-arc-400/35 text-arc-400"
                          : "bg-surface-container-high border border-outline-variant/20 text-on-surface-variant"
                      }`}
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
                <p className="text-xs flex items-center gap-1.5 text-[#ffb4ab]">
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
                  className="text-lg font-bold text-on-surface mb-2"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                  }}
                >
                  Configure &amp; Simulate
                </h3>
                <p className="text-sm max-w-sm text-on-surface-variant/50">
                  Set your investment parameters on the left and hit &ldquo;Run
                  Simulation&rdquo; to compare LP, HODL, and lending strategies.
                </p>
              </GlassCard>
            ) : liveResult ? (
              <>
                {/* Action Buttons: Save, Download, Share */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    Save Strategy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {shareNotification ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share
                      </>
                    )}
                  </button>

                  {/* Save notification */}
                  {saveNotification && (
                    <span
                      className="text-xs font-mono px-3 py-1.5 rounded-lg animate-pulse"
                      style={{
                        background: saveNotification.includes("saved")
                          ? "rgba(128,255,199,0.1)"
                          : "rgba(255,180,171,0.1)",
                        border: saveNotification.includes("saved")
                          ? "1px solid rgba(128,255,199,0.2)"
                          : "1px solid rgba(255,180,171,0.2)",
                        color: saveNotification.includes("saved")
                          ? "#80ffc7"
                          : "#ffb4ab",
                      }}
                    >
                      {saveNotification}
                    </span>
                  )}
                </div>

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
                        color: "#80ffc7",
                      },
                      {
                        label: "Impermanent Loss",
                        value: formatUsd(liveResult.impermanentLoss),
                        color: "#ffb4ab",
                      },
                      {
                        label: "Net P&L",
                        value: `${liveResult.lpNetValue - parsed.investmentUsd >= 0 ? "+" : ""}${formatUsd(liveResult.lpNetValue - parsed.investmentUsd)}`,
                        color:
                          liveResult.lpNetValue >= parsed.investmentUsd
                            ? "#80ffc7"
                            : "#ffb4ab",
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
                      className="text-sm font-bold text-on-surface"
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
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
                          className="flex items-center gap-1.5 text-xs text-on-surface-variant"
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
                          stroke="rgba(185,202,196,0.3)"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${v}d`}
                        />
                        <YAxis
                          stroke="rgba(185,202,196,0.3)"
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
                      className="text-sm font-bold text-on-surface"
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                      }}
                    >
                      Price Sensitivity
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg font-mono ${
                        priceChangePct === 0
                          ? "bg-surface-container-high border border-outline-variant/20 text-on-surface-variant"
                          : priceChangePct > 0
                          ? "bg-arc-400/10 border border-arc-400/20 text-arc-400"
                          : "bg-[rgba(255,180,171,0.1)] border border-[rgba(255,180,171,0.2)] text-[#ffb4ab]"
                      }`}
                    >
                      {priceChangePct >= 0 ? "+" : ""}
                      {priceChangePct}% price change
                    </span>
                  </div>
                  <p className="text-xs mb-4 text-on-surface-variant/50">
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
                        background: `linear-gradient(to right, #ffb4ab 0%, rgba(255,255,255,0.15) ${
                          ((priceChangePct + 50) / 150) * 100
                        }%, rgba(255,255,255,0.08) 100%)`,
                        accentColor: "#00e5c4",
                      }}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-mono text-on-surface-variant/40">
                        -50%
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant/40">
                        0%
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant/40">
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
                        <div className="text-[10px] font-mono uppercase tracking-widest mb-1 text-on-surface-variant">
                          New IL
                        </div>
                        <div className="text-sm font-bold font-mono text-[#ffb4ab]">
                          {formatUsd(liveResult.impermanentLoss)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest mb-1 text-on-surface-variant">
                          New LP Value
                        </div>
                        <div
                          className="text-sm font-bold font-mono"
                          style={{
                            color:
                              liveResult.lpNetValue >= parsed.investmentUsd
                                ? "#80ffc7"
                                : "#ffb4ab",
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
                        className="text-sm font-bold text-on-surface"
                        style={{
                          fontFamily: "var(--font-syne), sans-serif",
                        }}
                      >
                        Risk Assessment
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Risk Level */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant/60">
                          Risk Level
                        </span>
                        <RiskBadge level={liveResult.riskLevel} />
                      </div>

                      {/* Range Utilization */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-on-surface-variant/60">
                            Range Utilization
                          </span>
                          <span className="text-xs font-bold font-mono text-arc-400">
                            {liveResult.priceRangeUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-surface-container-high">
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
                        <span className="text-xs text-on-surface-variant/60">
                          Concentration Factor
                        </span>
                        <span className="text-xs font-bold font-mono text-on-surface">
                          {concentrationFactor.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Key Metrics */}
                  <GlassCard>
                    <h3
                      className="text-sm font-bold text-on-surface mb-4"
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
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
                            liveResult.lpApr >= 0 ? "#80ffc7" : "#ffb4ab",
                        },
                        {
                          label: "Fee Income",
                          value: `+${formatUsd(liveResult.lpFeeIncome)}`,
                          icon: DollarSign,
                          color: "#80ffc7",
                        },
                        {
                          label: "Impermanent Loss",
                          value: formatUsd(liveResult.impermanentLoss),
                          icon: TrendingDown,
                          color: "#ffb4ab",
                        },
                        {
                          label: "Net Return",
                          value: formatPct(liveResult.lpReturnPct),
                          icon: BarChart3,
                          color:
                            liveResult.lpReturnPct >= 0
                              ? "#80ffc7"
                              : "#ffb4ab",
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="rounded-lg p-3 bg-surface-container-high border border-outline-variant/20"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <m.icon
                              className="w-3 h-3"
                              style={{ color: m.color }}
                            />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
                              {m.label}
                            </span>
                          </div>
                          <div
                            className="text-base font-bold font-mono"
                            style={{ color: m.color }}
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
                  <p className="text-xs leading-relaxed text-on-surface-variant/60">
                    This simulator provides estimates based on simplified models.
                    Actual returns depend on market conditions, gas costs, pool
                    composition, and other factors. Not financial advice.
                  </p>
                </div>
              </>
            ) : null}

            {/* ── Saved Strategies Section ── */}
            {!loadingStrategies && savedStrategies.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-5">
                  <h2
                    className="text-xl font-bold text-on-surface"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Saved Strategies
                  </h2>
                  <span
                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold font-mono"
                    style={{
                      background: "rgba(0,229,196,0.1)",
                      border: "1px solid rgba(0,229,196,0.2)",
                      color: "#00e5c4",
                    }}
                  >
                    {savedStrategies.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {savedStrategies.map((strategy) => (
                    <SavedStrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Strategy Modal */}
      {showSaveModal && (
        <SaveStrategyModal
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
