import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

type WagmiConfig = ReturnType<typeof createConfig>;

// Persist the config across HMR re-evaluations in development.
const g = globalThis as typeof globalThis & { __wagmiConfig?: WagmiConfig };

/**
 * Must only be called in the browser.
 * WalletConnect connectors access browser-only APIs (indexedDB) during
 * createConfig() → connector setup(), so calling this on the server throws.
 */
export function getWagmiConfig(): WagmiConfig {
  if (typeof window === "undefined") {
    throw new Error("getWagmiConfig() must only be called in the browser");
  }

  if (!g.__wagmiConfig) {
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Popular",
          wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
        },
      ],
      {
        appName: "LiquidArk",
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
      }
    );

    g.__wagmiConfig = createConfig({
      connectors,
      chains: [base],
      ssr: true,
      transports: {
        [base.id]: http(),
      },
    });
  }

  return g.__wagmiConfig;
}
