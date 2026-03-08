"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { siweAdapter } from "@/lib/auth/siweAdapter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 60_000,
    },
  },
});

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function AppSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="text-slate-100 font-bold text-lg">LiquidArk</span>
        <div className="w-32 h-9 bg-slate-800 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  // Create wagmi config once on mount (browser-only)
  useEffect(() => {
    import("@/lib/wagmi/config").then((m) => {
      setConfig(m.getWagmiConfig());
    });
  }, []);

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        setAuthStatus(res.ok ? "authenticated" : "unauthenticated");
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  // Wrap the adapter to update local auth status after verify/signOut
  const adapter = useMemo(
    () => ({
      ...siweAdapter,
      verify: async (params: { message: string; signature: string }) => {
        const ok = await siweAdapter.verify(params);
        setAuthStatus(ok ? "authenticated" : "unauthenticated");
        return ok;
      },
      signOut: async () => {
        await siweAdapter.signOut();
        setAuthStatus("unauthenticated");
      },
    }),
    []
  );

  if (!config) {
    return <AppSkeleton />;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider
          adapter={adapter}
          status={authStatus}
        >
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#6366f1",
              accentColorForeground: "white",
              borderRadius: "large",
              fontStack: "system",
            })}
          >
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
