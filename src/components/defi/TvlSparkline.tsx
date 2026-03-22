"use client";

import { useMemo } from "react";
import type { HistoricalTvlPoint } from "@/lib/defi/defillama-types";

// ---------------------------------------------------------------------------
// Compact SVG sparkline for the TVL metric card.
// Renders a smooth area chart with gradient fill — no axes, no labels.
// Fits inside a card alongside the TVL number.
// ---------------------------------------------------------------------------

interface TvlSparklineProps {
  data: HistoricalTvlPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function TvlSparkline({
  data,
  width = 280,
  height = 64,
  className = "",
}: TvlSparklineProps) {
  const { path, areaPath } = useMemo(() => {
    if (data.length < 2) return { path: "", areaPath: "" };

    // Use last 90 days for a clean sparkline
    const cutoff = Date.now() / 1000 - 90 * 86400;
    let points = data.filter((p) => p.date >= cutoff);
    if (points.length < 2) points = data.slice(-60);
    if (points.length < 2) return { path: "", areaPath: "" };

    // Downsample to ~80 points for smoothness
    const step = Math.max(1, Math.floor(points.length / 80));
    const sampled = points.filter((_, i) => i % step === 0);
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }

    const minVal = Math.min(...sampled.map((p) => p.tvl));
    const maxVal = Math.max(...sampled.map((p) => p.tvl));
    const range = maxVal - minVal || 1;
    const pad = 4;
    const w = width - pad * 2;
    const h = height - pad * 2;

    const coords = sampled.map((p, i) => ({
      x: pad + (i / (sampled.length - 1)) * w,
      y: pad + h - ((p.tvl - minVal) / range) * h,
    }));

    // Build SVG path with cardinal spline interpolation for smoothness
    let linePath = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpx = (prev.x + curr.x) / 2;
      linePath += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    const last = coords[coords.length - 1];
    const area =
      linePath +
      ` L${last.x},${height} L${coords[0].x},${height} Z`;

    return { path: linePath, areaPath: area };
  }, [data, width, height]);

  if (!path) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: "100%", height: "100%" }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e5c4" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#00e5c4" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-fill)" />
      <path
        d={path}
        fill="none"
        stroke="#00e5c4"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: "drop-shadow(0 0 4px rgba(0,229,196,0.3))",
        }}
      />
    </svg>
  );
}
