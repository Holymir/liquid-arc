"use client";

// WalletConnect uses indexedDB — skip static pre-rendering for this page
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useWalletSync } from "@/hooks/useWalletSync";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  useWalletSync(); // auto-register wallet on connect

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-8 p-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-8 h-8 text-indigo-400"
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
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
          LiquidArk
        </h1>
      </div>

      {/* Tagline */}
      <p className="text-slate-400 text-lg text-center max-w-sm">
        Track your DeFi portfolio across chains — token balances, LP positions,
        and P&L in one place.
      </p>

      {/* Connect */}
      <ConnectButton />

      {/* Feature hints */}
      <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg text-center">
        {[
          { label: "Token Balances", icon: "💰" },
          { label: "LP Positions", icon: "🏊" },
          { label: "P&L Tracking", icon: "📈" },
        ].map((f) => (
          <div
            key={f.label}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
          >
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-slate-400 text-xs">{f.label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
