import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, mainnet, arbitrum } from "wagmi/chains";

// Singleton: WalletConnect Core throws if initialized more than once.
// Using a module-level variable ensures one instance per process.
let _config: ReturnType<typeof getDefaultConfig> | null = null;

export function getWagmiConfig() {
  if (!_config) {
    _config = getDefaultConfig({
      appName: "LiquidArk",
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
      chains: [base, mainnet, arbitrum],
      ssr: true,
    });
  }
  return _config;
}

// Convenience export for components that import config directly
export const config = getWagmiConfig();
