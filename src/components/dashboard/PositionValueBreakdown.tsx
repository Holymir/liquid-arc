"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface PositionValueBreakdownProps {
  principal: number;
  fees: number;
  emissions: number;
  total: number;
  entryValue?: number;
  pnl?: { absolute: number; percent: number };
  apr?: number;
  avgDailyEarn?: number;
  last24hEarn?: number;
  inRange?: boolean;
  isStaked?: boolean;
  size?: "compact" | "hero";
}

export function PositionValueBreakdown({
  principal,
  fees,
  emissions,
  total,
  entryValue,
  pnl,
  apr,
  avgDailyEarn,
  last24hEarn,
  inRange,
  isStaked = false,
  size = "compact",
}: PositionValueBreakdownProps) {
  const isHero = size === "hero";
  const totalSize = isHero ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl";
  const labelSize = isHero ? "text-[11px]" : "text-[10px]";

  const positive = (pnl?.absolute ?? 0) >= 0;
  // Staked Aerodrome positions: trading fees are harvested by the gauge for
  // voters and are not claimable by the LP, so they don't contribute to Total.
  const feesHarvested = isStaked;
  const feesTooltip = feesHarvested
    ? "Harvested by the gauge for voters — not claimable by the LP, does not count toward total value."
    : "Unclaimed trading fees";

  return (
    <div
      className={`rounded-xl ${
        isHero ? "glass-card p-6" : "bg-slate-800/20 border border-slate-700/30 p-4"
      }`}
    >
      {/* Total row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className={`text-slate-500 ${labelSize} uppercase tracking-widest font-medium mb-1`}>
            Total Value
          </p>
          <p className={`text-slate-100 font-bold ${totalSize} tabular-nums tracking-tight`}>
            {formatUsd(total)}
          </p>
          {entryValue != null && entryValue > 0 && (
            <p className="text-slate-600 text-[11px] mt-1">
              Entry {formatUsd(entryValue)}
            </p>
          )}
        </div>

        {pnl && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
              {positive ? (
                <TrendingUp className={isHero ? "w-4 h-4" : "w-3.5 h-3.5"} />
              ) : (
                <TrendingDown className={isHero ? "w-4 h-4" : "w-3.5 h-3.5"} />
              )}
              <span className={`${isHero ? "text-base" : "text-sm"} font-semibold tabular-nums`}>
                {positive ? "+" : ""}
                {formatUsd(pnl.absolute)}
              </span>
            </div>
            <span
              className={`${
                positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
              } text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums`}
            >
              {positive ? "+" : ""}
              {pnl.percent.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Breakdown chips — LP + Fees + Emissions */}
      <div
        className={`grid grid-cols-3 gap-2 ${isHero ? "mt-5" : "mt-3"} text-center`}
      >
        <div className="bg-slate-800/30 border border-slate-700/20 rounded-lg py-2 px-2">
          <p className={`text-slate-500 ${labelSize} uppercase tracking-wider font-medium`}>
            LP Principal
          </p>
          <p className="text-slate-200 font-semibold text-sm tabular-nums mt-0.5">
            {formatUsd(principal)}
          </p>
        </div>
        <div
          className="bg-slate-800/30 border border-slate-700/20 rounded-lg py-2 px-2"
          title={feesTooltip}
        >
          <p className={`text-slate-500 ${labelSize} uppercase tracking-wider font-medium`}>
            {feesHarvested ? "Fees · harvested" : "Fees"}
          </p>
          <p
            className={`font-semibold text-sm tabular-nums mt-0.5 ${
              feesHarvested
                ? "text-slate-500 line-through"
                : fees > 0
                  ? "text-emerald-400"
                  : "text-slate-500"
            }`}
          >
            {!feesHarvested && fees > 0 ? "+" : ""}
            {formatUsd(fees)}
          </p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/20 rounded-lg py-2 px-2">
          <p className={`text-slate-500 ${labelSize} uppercase tracking-wider font-medium`}>
            Emissions
          </p>
          <p
            className={`font-semibold text-sm tabular-nums mt-0.5 ${
              emissions > 0 ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            {emissions > 0 ? "+" : ""}
            {formatUsd(emissions)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {(inRange != null || apr != null || avgDailyEarn != null || last24hEarn != null) && (
        <div className={`flex flex-wrap gap-x-5 gap-y-1.5 ${isHero ? "mt-4" : "mt-3"} text-xs`}>
          {inRange != null && (
            <div>
              <span className="text-slate-500">Range </span>
              <span className={inRange ? "text-emerald-400" : "text-amber-400"}>
                {inRange ? "Active" : "Inactive"}
              </span>
            </div>
          )}
          {apr != null && apr > 0 && (
            <div>
              <span className="text-slate-500">APR </span>
              <span className="text-arc-400 font-semibold tabular-nums">
                {apr.toFixed(1)}%
              </span>
            </div>
          )}
          {last24hEarn != null && last24hEarn > 0 && (
            <div>
              <span className="text-slate-500">24h </span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                +{formatUsd(last24hEarn)}
              </span>
            </div>
          )}
          {avgDailyEarn != null && avgDailyEarn > 0 && (
            <div>
              <span className="text-slate-500">Avg </span>
              <span className="text-emerald-400/60 font-semibold tabular-nums">
                ~{formatUsd(avgDailyEarn)}/d
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
