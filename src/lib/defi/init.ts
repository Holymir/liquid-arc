// Protocol registration — import this to ensure all adapters are registered

import { protocolRegistry } from "./registry";
import { aerodromePoolProvider, velodromePoolProvider } from "./aerodrome/pool-provider";
import { uniswapV3PoolProviders } from "./uniswap-v3/pool-provider";
import { raydiumPoolProvider } from "./raydium/pool-provider";
import { orcaPoolProvider } from "./orca/pool-provider";

// Register pool data providers
protocolRegistry.registerPoolProvider(aerodromePoolProvider);
protocolRegistry.registerPoolProvider(velodromePoolProvider);

for (const provider of Object.values(uniswapV3PoolProviders)) {
  protocolRegistry.registerPoolProvider(provider);
}

protocolRegistry.registerPoolProvider(raydiumPoolProvider);
protocolRegistry.registerPoolProvider(orcaPoolProvider);

export { protocolRegistry };
