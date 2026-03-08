"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http, type Config } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Minimal config used for the server render and initial hydration.
// Has NO connectors so it never touches WalletConnect / indexedDB.
const ssrConfig = createConfig({
  chains: [base],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 60_000,
    },
  },
});

// Cache so the dynamic import + config creation only happens once.
let fullConfigPromise: Promise<Config> | null = null;
function loadFullConfig(): Promise<Config> {
  if (!fullConfigPromise) {
    // Dynamic import keeps WalletConnect / RainbowKit wallets out of the
    // initial bundle — the compiler doesn't need to process them eagerly.
    fullConfigPromise = import("@/lib/wagmi/config").then((m) => m.getWagmiConfig());
  }
  return fullConfigPromise;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(ssrConfig as Config);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadFullConfig().then((cfg) => {
      setConfig(cfg);
      setIsReady(true);
    });
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#6366f1",
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          {isReady ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
