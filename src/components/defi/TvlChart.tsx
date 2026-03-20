"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HistoricalTvlPoint } from "@/lib/defi/defillama-types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(timestamp: number, range: Period): string {
  const d = new Date(timestamp * 1000);
  if (range === "all" || range === "1y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as HistoricalTvlPoint;
  return (
    <div className="bg-[#0a0e17]/95 backdrop-blur-xl border border-slate-700/40 rounded-xl px-3.5 py-2.5 shadow-2xl shadow-black/40">
      <p className="text-[10px] text-slate-500 mb-1">
        {formatTooltipDate(point.date)}
      </p>
      <p
        className="text-sm font-bold text-slate-100 tabular-nums"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {formatCompact(point.tvl)}
      </p>
    </div>
  );
}

// -- Component --------------------------------------------------------------

const PERIODS = ["90d", "1y", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "90d": "90D",
  "1y": "1Y",
  all: "All",
};

const PERIOD_DAYS: Record<Period, number> = {
  "90d": 90,
  "1y": 365,
  all: Infinity,
};

interface TvlChartProps {
  data: HistoricalTvlPoint[];
  isLoading: boolean;
}

export function TvlChart({ data, isLoading }: TvlChartProps) {
  const [period, setPeriod] = useState<Period>("all");

  const filteredData = useMemo(() => {
    if (period === "all" || data.length === 0) return data;
    const cutoff = Date.now() / 1000 - PERIOD_DAYS[period] * 86400;
    return data.filter((p) => p.date >= cutoff);
  }, [data, period]);

  const { minVal, maxVal } = useMemo(() => {
    if (filteredData.length < 2) return { minVal: 0, maxVal: 0 };
    const values = filteredData.map((d) => d.tvl);
    return { minVal: Math.min(...values), maxVal: Math.max(...values) };
  }, [filteredData]);

  const yDomain = useMemo(() => {
    if (filteredData.length < 2) return [0, 100];
    const range = maxVal - minVal;
    const padding = range * 0.08;
    return [Math.max(0, minVal - padding), maxVal + padding];
  }, [filteredData, minVal, maxVal]);

  const handlePeriodChange = useCallback((p: Period) => setPeriod(p), []);

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0">
          <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
            Historical TVL
          </h2>
          {filteredData.length >= 2 && !isLoading && (
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-[9px] text-slate-600"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                H: {formatCompact(maxVal)} &middot; L: {formatCompact(minVal)}
              </span>
            </div>
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
        <div className="h-[300px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            Loading chart...
          </div>
        </div>
      ) : filteredData.length < 2 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500 text-sm">No historical data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={filteredData}
            margin={{ top: 12, right: 4, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id="tvl-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5c4" stopOpacity={0.15} />
                <stop offset="60%" stopColor="#00e5c4" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#00e5c4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v, period)}
              tick={{ fill: "#475569", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fill: "#475569", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={62}
              domain={yDomain}
              tickCount={5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#00e5c4",
                strokeWidth: 1,
                strokeOpacity: 0.3,
                strokeDasharray: "3 3",
              }}
            />

            <Area
              type="monotone"
              dataKey="tvl"
              stroke="#00e5c4"
              strokeWidth={2}
              fill="url(#tvl-gradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#00e5c4",
                stroke: "#0a0e17",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
