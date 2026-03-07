"use client";

import type { TokenBalanceJSON } from "@/types";

interface TokenListProps {
  tokens: TokenBalanceJSON[];
  isLoading?: boolean;
}

function formatUsd(value: number): string {
  if (value < 0.01) return "< $0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBalance(balance: string, decimals: number): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function TokenSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700" />
        <div className="w-16 h-4 bg-slate-700 rounded" />
      </div>
      <div className="w-24 h-4 bg-slate-700 rounded" />
      <div className="w-20 h-4 bg-slate-700 rounded" />
    </div>
  );
}

export function TokenList({ tokens, isLoading }: TokenListProps) {
  const sorted = [...tokens].sort(
    (a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0)
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
        Token Balances
      </h2>

      <div className="divide-y divide-slate-800/60">
        {/* Header */}
        <div className="grid grid-cols-3 pb-2 text-slate-500 text-xs uppercase tracking-wider">
          <span>Asset</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Value</span>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <TokenSkeleton key={i} />)
        ) : sorted.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No token balances found
          </div>
        ) : (
          sorted.map((token) => (
            <div
              key={token.tokenAddress}
              className="grid grid-cols-3 py-3 items-center hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {token.symbol.slice(0, 2)}
                </div>
                <span className="text-slate-200 font-medium text-sm">
                  {token.symbol}
                </span>
              </div>
              <span className="text-right text-slate-300 text-sm font-mono tabular-nums">
                {formatBalance(token.formattedBalance, token.decimals)}
              </span>
              <span className="text-right text-slate-200 text-sm font-semibold">
                {token.usdValue !== undefined
                  ? formatUsd(token.usdValue)
                  : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
