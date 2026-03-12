"use client";

import { useMemo } from "react";

interface PriceRangeChartProps {
  tickLower: number;
  tickUpper: number;
  token0Decimals: number;
  token1Decimals: number;
  token0Symbol: string;
  token1Symbol: string;
  currentToken0Price: number;
  currentToken1Price: number;
}

function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1);
}

function generateVolumeBars(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1;
    const base = Math.exp(-t * t * 2.5);
    const noise = 0.85 + Math.sin(i * 7.3) * 0.1 + Math.cos(i * 13.7) * 0.05;
    bars.push(base * noise);
  }
  return bars;
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return p.toExponential(2);
}

export function PriceRangeChart({
  tickLower,
  tickUpper,
  token0Decimals,
  token1Decimals,
  token0Symbol,
  token1Symbol,
  currentToken0Price,
  currentToken1Price,
}: PriceRangeChartProps) {
  const { priceLower, priceUpper, currentPrice, isInRange } = useMemo(() => {
    const pLower = tickToPrice(tickLower, token0Decimals, token1Decimals);
    const pUpper = tickToPrice(tickUpper, token0Decimals, token1Decimals);
    const pCurrent = currentToken1Price > 0 ? currentToken0Price / currentToken1Price : 0;
    const inRange = pCurrent >= pLower && pCurrent <= pUpper;
    return { priceLower: pLower, priceUpper: pUpper, currentPrice: pCurrent, isInRange: inRange };
  }, [tickLower, tickUpper, token0Decimals, token1Decimals, currentToken0Price, currentToken1Price]);

  // Chart layout
  const SVG_W = 440;
  const SVG_H = 160;
  const CHART_TOP = 20;
  const CHART_BOTTOM = 120;
  const CHART_H = CHART_BOTTOM - CHART_TOP;
  const PAD_L = 20;
  const PAD_R = 20;
  const CHART_W = SVG_W - PAD_L - PAD_R;

  const rangeWidth = priceUpper - priceLower;
  const padding = 0.25;
  const viewMin = priceLower - rangeWidth * padding;
  const viewMax = priceUpper + rangeWidth * padding;
  const viewWidth = viewMax - viewMin;

  const toX = (price: number) => PAD_L + ((price - viewMin) / viewWidth) * CHART_W;
  const xLower = toX(priceLower);
  const xUpper = toX(priceUpper);
  const xCurrent = Math.max(PAD_L, Math.min(SVG_W - PAD_R, toX(currentPrice)));

  // Volume bars
  const BAR_COUNT = 48;
  const volumeBars = useMemo(() => generateVolumeBars(BAR_COUNT), []);
  const barWidth = CHART_W / BAR_COUNT;

  // Range percentage
  const rangePct = rangeWidth > 0
    ? Math.max(0, Math.min(100, ((currentPrice - priceLower) / rangeWidth) * 100))
    : 0;

  // Arc curve: a quadratic bezier from xLower to xUpper that bows upward
  const arcMidX = (xLower + xUpper) / 2;
  const arcSpan = xUpper - xLower;
  const arcBow = Math.min(arcSpan * 0.35, CHART_H * 0.55); // how much it curves up
  const arcY = CHART_BOTTOM - 8; // baseline of the arc
  const arcPeakY = arcY - arcBow;
  const arcPath = `M ${xLower} ${arcY} Q ${arcMidX} ${arcPeakY} ${xUpper} ${arcY}`;

  // Find point on the arc curve for the current price marker
  // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
  const t = rangeWidth > 0
    ? Math.max(0, Math.min(1, (currentPrice - priceLower) / rangeWidth))
    : 0.5;
  const curveX = (1 - t) * (1 - t) * xLower + 2 * (1 - t) * t * arcMidX + t * t * xUpper;
  const curveY = (1 - t) * (1 - t) * arcY + 2 * (1 - t) * t * arcPeakY + t * t * arcY;

  // Fill path: arc + close along bottom
  const fillPath = `${arcPath} L ${xUpper} ${CHART_BOTTOM} L ${xLower} ${CHART_BOTTOM} Z`;

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
            Price Range
          </p>
          <p className="text-slate-600 text-[11px] mt-0.5">
            {token1Symbol} per {token0Symbol}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isInRange && (
            <span className="text-slate-500 text-[10px] tabular-nums font-mono">
              {rangePct.toFixed(0)}% through range
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${
              isInRange
                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
            }`}
          >
            {isInRange ? "In Range" : "Out of Range"}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="arc-curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5c4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00e5c4" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="arc-vol-active" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5c4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00e5c4" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="arc-vol-inactive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.03" />
          </linearGradient>
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="arc-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PAD_L}
            y1={CHART_TOP + CHART_H * frac}
            x2={SVG_W - PAD_R}
            y2={CHART_TOP + CHART_H * frac}
            stroke="#334155"
            strokeOpacity="0.12"
            strokeDasharray="2 4"
          />
        ))}

        {/* Volume distribution bars (behind the curve) */}
        {volumeBars.map((h, i) => {
          const bx = PAD_L + i * barWidth;
          const barH = h * CHART_H * 0.85;
          const barY = CHART_BOTTOM - barH;
          const inActiveRange = bx >= xLower && bx + barWidth <= xUpper;
          return (
            <rect
              key={i}
              x={bx + 0.5}
              y={barY}
              width={Math.max(0, barWidth - 1)}
              height={barH}
              fill={inActiveRange ? "url(#arc-vol-active)" : "url(#arc-vol-inactive)"}
              rx="1"
            />
          );
        })}

        {/* Arc curve — gradient fill underneath */}
        <path d={fillPath} fill="url(#arc-curve-fill)" />

        {/* Arc curve — glow layer */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(0,229,196,0.25)"
          strokeWidth="8"
          filter="url(#arc-glow)"
        />

        {/* Arc curve — main stroke */}
        <path
          d={arcPath}
          fill="none"
          stroke="#00e5c4"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Lower bound dashed line */}
        <line
          x1={xLower} y1={CHART_TOP - 4} x2={xLower} y2={CHART_BOTTOM + 4}
          stroke="#00e5c4" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3"
        />
        {/* Lower bound endpoint dot */}
        <circle cx={xLower} cy={arcY} r="3" fill="rgba(0,229,196,0.5)" />
        <text
          x={xLower} y={CHART_BOTTOM + 18}
          textAnchor="middle" fill="#00e5c4" fontSize="8"
          fontFamily="ui-monospace, monospace" opacity="0.8"
        >
          {formatPrice(priceLower)}
        </text>
        <text x={xLower} y={CHART_BOTTOM + 28} textAnchor="middle" fill="#64748b" fontSize="7">
          Min
        </text>

        {/* Upper bound dashed line */}
        <line
          x1={xUpper} y1={CHART_TOP - 4} x2={xUpper} y2={CHART_BOTTOM + 4}
          stroke="#00e5c4" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3"
        />
        {/* Upper bound endpoint dot */}
        <circle cx={xUpper} cy={arcY} r="3" fill="rgba(0,229,196,0.5)" />
        <text
          x={xUpper} y={CHART_BOTTOM + 18}
          textAnchor="middle" fill="#00e5c4" fontSize="8"
          fontFamily="ui-monospace, monospace" opacity="0.8"
        >
          {formatPrice(priceUpper)}
        </text>
        <text x={xUpper} y={CHART_BOTTOM + 28} textAnchor="middle" fill="#64748b" fontSize="7">
          Max
        </text>

        {/* Current price vertical line */}
        <line
          x1={xCurrent} y1={CHART_TOP - 4} x2={xCurrent} y2={CHART_BOTTOM}
          stroke="white" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 3"
        />

        {/* Current price dot on the curve — glowing */}
        {isInRange && (
          <>
            <circle cx={curveX} cy={curveY} r="6" fill="#00e5c4" filter="url(#arc-dot-glow)" />
            <circle cx={curveX} cy={curveY} r="3.5" fill="#aff8ee" />
          </>
        )}
        {!isInRange && (
          <>
            <circle cx={xCurrent} cy={CHART_BOTTOM - 8} r="5" fill="rgba(251,191,36,0.6)" filter="url(#arc-dot-glow)" />
            <circle cx={xCurrent} cy={CHART_BOTTOM - 8} r="3" fill="#fbbf24" />
          </>
        )}

        {/* Current price label */}
        <text
          x={Math.max(PAD_L + 30, Math.min(SVG_W - PAD_R - 30, xCurrent))}
          y={CHART_BOTTOM + 18}
          textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          {formatPrice(currentPrice)}
        </text>
        <text
          x={Math.max(PAD_L + 30, Math.min(SVG_W - PAD_R - 30, xCurrent))}
          y={CHART_BOTTOM + 28}
          textAnchor="middle" fill="#94a3b8" fontSize="7"
        >
          Current
        </text>
      </svg>

      {/* Price cards row */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-slate-800/30 border border-[#00e5c4]/10 rounded-xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Min Price</p>
          <p className="text-xs text-arc-400 font-mono tabular-nums font-medium">
            {formatPrice(priceLower)}
          </p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/20 rounded-xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Current</p>
          <p className="text-xs text-slate-100 font-mono tabular-nums font-medium">
            {formatPrice(currentPrice)}
          </p>
        </div>
        <div className="bg-slate-800/30 border border-[#00e5c4]/10 rounded-xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Max Price</p>
          <p className="text-xs text-arc-400 font-mono tabular-nums font-medium">
            {formatPrice(priceUpper)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-[11px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#00e5c4]/20 border border-[#00e5c4]/30" />
            <span className="text-slate-500">Your Range</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 bg-white rounded-full" />
            <span className="text-slate-500">Current Price</span>
          </div>
        </div>
        <span className="text-slate-600 font-mono">
          {token0Symbol}/{token1Symbol}
        </span>
      </div>
    </div>
  );
}
