"use client";

// WalletConnect uses indexedDB — skip static pre-rendering for this page
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useWalletSync } from "@/hooks/useWalletSync";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  useWalletSync();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-bold text-lg">LiquidArk</span>
        </div>
        <ConnectButton />
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Dashboard address={address} />
      </main>
    </div>
  );
}
