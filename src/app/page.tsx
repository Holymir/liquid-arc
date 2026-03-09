"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-7 h-7 text-indigo-400"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
            LiquidArk
          </h1>
        </div>

        <p className="text-slate-400 text-center text-sm sm:text-base leading-relaxed">
          Track your DeFi LP positions, token balances, and P&L — starting with Aerodrome on Base.
        </p>

        {/* Connect */}
        <div className="mt-2">
          <ConnectButton />
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            "Concentrated LP Tracking",
            "Claimable Rewards",
            "Portfolio History",
            "Multi-Wallet",
          ].map((label) => (
            <span
              key={label}
              className="text-slate-500 text-xs border border-slate-800 rounded-full px-3 py-1"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Pool Analytics link */}
        <Link
          href="/pools"
          className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/30 rounded-lg px-4 py-2"
        >
          Explore Pool Analytics
        </Link>

        {/* Protocol badges */}
        <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Aerodrome
          </div>
          <span className="text-slate-700">&middot;</span>
          <span className="text-slate-700">Uniswap soon</span>
          <span className="text-slate-700">&middot;</span>
          <span className="text-slate-700">More chains coming</span>
        </div>
      </div>
    </main>
  );
}
