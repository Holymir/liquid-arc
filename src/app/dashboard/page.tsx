"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WalletPanel } from "@/components/wallet/WalletPanel";

export default function DashboardPage() {
  const { isConnected, address: connectedAddress } = useAccount();
  const router = useRouter();

  const { wallets, isLoading: walletsLoading, addWallet, removeWallet } = useTrackedWallets();
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);

  const hasConnected = useRef(false);
  const autoAdded = useRef(false);

  useEffect(() => {
    if (isConnected) hasConnected.current = true;
  }, [isConnected]);

  // Auto-add connected wallet once
  useEffect(() => {
    if (connectedAddress && !autoAdded.current) {
      autoAdded.current = true;
      addWallet(connectedAddress, "My Wallet");
    }
  }, [connectedAddress, addWallet]);

  // Default selection
  useEffect(() => {
    if (selectedAddress) return;
    if (connectedAddress) {
      setSelectedAddress(connectedAddress);
    } else if (wallets.length > 0) {
      setSelectedAddress(wallets[0].address);
    }
  }, [connectedAddress, wallets, selectedAddress]);

  useEffect(() => {
    if (!isConnected && hasConnected.current) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  const handleSelectWallet = (wallet: TrackedWallet) => {
    setSelectedAddress(wallet.address);
  };

  const handleAddWallet = async (address: string, label?: string) => {
    const ok = await addWallet(address, label);
    if (ok) setSelectedAddress(address);
    return ok;
  };

  const handleRemoveWallet = async (address: string) => {
    await removeWallet(address);
    if (address.toLowerCase() === selectedAddress?.toLowerCase()) {
      const remaining = wallets.filter((w) => w.address.toLowerCase() !== address.toLowerCase());
      setSelectedAddress(remaining[0]?.address ?? connectedAddress);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
        <span className="text-slate-100 font-bold text-lg shrink-0">LiquidArk</span>
        <ConnectButton />
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6">
        <aside className="w-72 shrink-0">
          <WalletPanel
            wallets={wallets}
            isLoading={walletsLoading}
            selectedAddress={selectedAddress}
            connectedAddress={connectedAddress}
            onSelect={handleSelectWallet}
            onAdd={handleAddWallet}
            onRemove={handleRemoveWallet}
          />
        </aside>

        <main className="flex-1 min-w-0">
          {selectedAddress ? (
            <Dashboard address={selectedAddress} />
          ) : (
            <div className="text-center text-slate-500 py-20 text-sm">
              Add a wallet to start tracking
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
