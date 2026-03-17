"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import { useAllPortfolios } from "@/hooks/useAllPortfolios";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletPanel } from "@/components/wallet/WalletPanel";
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
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
    <AppLayout
      sidebarTitle="Wallets"
      sidebarSlot={
        <WalletPanel
          wallets={wallets}
          isLoading={walletsLoading}
          selectedAddress={viewMode === "wallet" ? selectedAddress : undefined}
          onSelect={handleSelectWallet}
          onAdd={handleAddWallet}
          onRemove={handleRemoveWallet}
        />
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* View toggle */}
        {wallets.length > 0 && (
          <div className="flex items-center gap-2 mb-5 animate-fade-in-up">
            <div className="flex gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/20">
              <button
                onClick={() => setViewMode("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "overview"
                    ? "bg-slate-700/60 text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Overview
              </button>
              <button
                onClick={() => setViewMode("wallet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "wallet"
                    ? "bg-slate-700/60 text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                Per Wallet
              </button>
            </div>
            {viewMode === "overview" && wallets.length > 1 && (
              <span className="text-slate-600 text-[10px] ml-1">
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-4">
                <Plus className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-300 text-sm font-medium">No wallets tracked</p>
              <p className="text-slate-500 text-xs mt-1">Add a wallet address to start tracking positions</p>
            </div>
          )
        ) : selectedAddress ? (
          <Dashboard address={selectedAddress} chainId={selectedWallet?.chainId} />
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-4">
              <Wallet className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-300 text-sm font-medium">Select a wallet</p>
            <p className="text-slate-500 text-xs mt-1">Choose a wallet from the sidebar to view details</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
