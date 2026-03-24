"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import { useAllPortfolios } from "@/hooks/useAllPortfolios";
import { AppLayout } from "@/components/layout/AppLayout";
import { AggregateOverview } from "@/components/dashboard/AggregateOverview";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Plus, Loader2, LayoutGrid, Wallet } from "lucide-react";

type ViewMode = "overview" | "wallet";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const { wallets, isLoading: walletsLoading, addWallet, removeWallet } = useTrackedWallets();
  const { walletPortfolios, aggregate, isLoading: portfolioLoading, hasAnyData, refresh, refreshWallet } = useAllPortfolios(wallets);

  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedWallet, setSelectedWallet] = useState<TrackedWallet | undefined>(undefined);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Auto-select first wallet when switching to wallet view
  useEffect(() => {
    if (viewMode === "wallet" && !selectedWallet && wallets.length > 0) {
      setSelectedWallet(wallets[0]);
    }
  }, [viewMode, selectedWallet, wallets]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a141d" }}>
        <Loader2 className="w-6 h-6 text-arc-400 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const handleSelectWallet = (wallet: TrackedWallet) => {
    setSelectedWallet(wallet);
    setViewMode("wallet");
  };

  const handleAddWallet = async (address: string, label?: string) => {
    const ok = await addWallet(address, label);
    if (ok) {
      const isSolana = !address.startsWith("0x");
      setSelectedWallet({
        id: "",
        address,
        chainId: isSolana ? "solana" : "base",
        chainType: isSolana ? "svm" : "evm",
        label: label ?? null,
      });
    }
    return ok;
  };

  const handleRemoveWallet = async (address: string) => {
    await removeWallet(address);
    const isSolana = !address.startsWith("0x");
    const isSelected = isSolana
      ? address === selectedWallet?.address
      : address.toLowerCase() === selectedWallet?.address?.toLowerCase();
    if (isSelected) {
      setSelectedWallet(undefined);
      setViewMode("overview");
    }
  };

  const selectedAddress = selectedWallet?.address;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* View toggle */}
        {wallets.length > 0 && (
          <div className="flex items-center gap-2 mb-6 animate-fade-in-up">
            <div className="flex gap-0.5 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/10">
              <button
                onClick={() => setViewMode("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                  viewMode === "overview"
                    ? "bg-surface-bright text-arc-400"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Overview
              </button>
              <button
                onClick={() => setViewMode("wallet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                  viewMode === "wallet"
                    ? "bg-surface-bright text-arc-400"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                Per Wallet
              </button>
            </div>
            {viewMode === "overview" && wallets.length > 1 && (
              <span className="text-on-surface-variant text-[10px] ml-1 font-mono">
                {wallets.length} wallets
              </span>
            )}
          </div>
        )}

        {viewMode === "overview" ? (
          wallets.length > 0 ? (
            <AggregateOverview
              aggregate={aggregate}
              walletPortfolios={walletPortfolios}
              isLoading={portfolioLoading}
              hasAnyData={hasAnyData}
              onRefresh={refresh}
              onSelectWallet={(wallet) => {
                setSelectedWallet(wallet);
                setViewMode("wallet");
              }}
            />
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/10 mb-4">
                <Plus className="w-7 h-7 text-on-surface-variant" />
              </div>
              <p className="text-on-surface text-sm font-medium">No wallets tracked</p>
              <p className="text-on-surface-variant text-xs mt-1 font-mono">
                Add a wallet address to start tracking positions
              </p>
            </div>
          )
        ) : selectedAddress ? (
          <Dashboard address={selectedAddress} chainId={selectedWallet?.chainId} />
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/10 mb-4">
              <Wallet className="w-7 h-7 text-on-surface-variant" />
            </div>
            <p className="text-on-surface text-sm font-medium">Select a wallet</p>
            <p className="text-on-surface-variant text-xs mt-1 font-mono">
              Choose a wallet from the sidebar to view details
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
