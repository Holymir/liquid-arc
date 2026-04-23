"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface SnapshotPoint {
  snapshotAt: string;
  totalUsdValue: number;
}

interface PnLData {
  absoluteChange: number;
  percentChange: number;
  currentValue: number;
  previousValue: number;
  period: string;
}

interface PortfolioChartProps {
  address?: string;
  chainId?: string;
}

const PERIODS = ["7d", "30d", "90d", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7D",
  "30d": "1M",
  "90d": "3M",
  all: "All",
};

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsdFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "7d") {
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, startValue }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  const change = startValue > 0 ? value - startValue : 0;
  const changePct = startValue > 0 ? (change / startValue) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="bg-[#0a0e17]/95 backdrop-blur-xl border border-slate-700/40 rounded-xl px-3.5 py-2.5 shadow-2xl shadow-black/40">
      <p className="text-[10px] text-slate-500 mb-1">{formatTooltipDate(String(label))}</p>
      <p className="text-sm font-bold text-slate-100 font-mono tabular-nums">
        {formatUsdFull(value)}
      </p>
      {startValue > 0 && (
        <p className={`text-[10px] font-semibold mt-0.5 tabular-nums ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "+" : ""}{formatUsdFull(change)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
        </p>
      )}
    </div>
  );
}

export function PortfolioChart({ address, chainId = "base" }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<SnapshotPoint[]>([]);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/portfolio/${address}/history?period=${period}&chainId=${chainId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setData(json.snapshots ?? []);
          setPnl(json.pnl ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [address, period, chainId]);

  const { isUp, minVal, maxVal, startValue, latestValue } = useMemo(() => {
    if (data.length < 2)
      return { isUp: true, minVal: 0, maxVal: 0, startValue: 0, latestValue: 0 };
    const values = data.map((d) => d.totalUsdValue);
    const first = values[0];
    const last = values[values.length - 1];
    return {
      isUp: last >= first,
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
      startValue: first,
      latestValue: last,
    };
  }, [data]);

  const accentColor = isUp ? "#34d399" : "#f87171";
  const accentColorMuted = isUp ? "rgba(52,211,153," : "rgba(248,113,113,";

  // Gradient IDs need to be unique per instance
  const gradientId = `portfolio-fill-${isUp ? "up" : "down"}`;

  const yDomain = useMemo(() => {
    if (data.length < 2) return [0, 100];
    const range = maxVal - minVal;
    const padding = range * 0.08;
    return [Math.max(0, minVal - padding), maxVal + padding];
  }, [data, minVal, maxVal]);

  const handlePeriodChange = useCallback((p: Period) => setPeriod(p), []);

  const changeAbs = pnl?.absoluteChange ?? (latestValue - startValue);
  const changePct = pnl?.percentChange ?? (startValue > 0 ? ((latestValue - startValue) / startValue) * 100 : 0);

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
              Portfolio History
            </h2>
            <span
              className="text-slate-600 text-[10px] tracking-wide"
              title="Each point is total value at snapshot time: LP principal + unclaimed fees + unclaimed emissions + wallet tokens."
            >
              total value (incl. fees &amp; emissions)
            </span>
            {data.length >= 2 && !isLoading && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="tabular-nums">
                  {isUp ? "+" : ""}{formatUsdFull(changeAbs)}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                  isUp ? "bg-emerald-400/10" : "bg-red-400/10"
                }`}>
                  {isUp ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          {data.length >= 2 && !isLoading && (
            <p className="text-slate-100 text-lg font-bold font-mono tabular-nums mt-1">
              {formatUsdFull(latestValue)}
            </p>
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-0.5 bg-slate-800/50 rounded-lg p-0.5 shrink-0 border border-slate-700/20">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                period === p
                  ? "bg-slate-700/60 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            Loading chart...
          </div>
        </div>
      ) : data.length < 2 ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-3">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">Not enough history yet</p>
            <p className="text-xs mt-1 text-slate-500">
              Snapshots are saved periodically — check back later
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Min / Max badges */}
          <div className="absolute top-1 right-2 z-10 flex items-center gap-3 text-[9px] font-mono text-slate-600">
            <span>H: {formatUsd(maxVal)}</span>
            <span>L: {formatUsd(minVal)}</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
                  <stop offset="60%" stopColor={accentColor} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="snapshotAt"
                tickFormatter={(v) => formatDate(v, period)}
                tick={{ fill: "#475569", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatUsd}
                tick={{ fill: "#475569", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={62}
                domain={yDomain}
                tickCount={5}
              />

              {/* Start value reference line */}
              <ReferenceLine
                y={startValue}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              <Tooltip
                content={<CustomTooltip startValue={startValue} />}
                cursor={{
                  stroke: accentColor,
                  strokeWidth: 1,
                  strokeOpacity: 0.3,
                  strokeDasharray: "3 3",
                }}
              />

              <Area
                type="monotone"
                dataKey="totalUsdValue"
                stroke={accentColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: accentColor,
                  stroke: "#0a0e17",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Bottom fade line */}
          <div
            className="absolute bottom-[28px] left-[62px] right-[4px] h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColorMuted}0.06), transparent)` }}
          />
        </div>
      )}
    </div>
  );
}
