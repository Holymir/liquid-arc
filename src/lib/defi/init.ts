// Protocol registration — import this to ensure all adapters are registered

import { protocolRegistry } from "./registry";
import { aerodromePoolProvider, velodromePoolProvider } from "./aerodrome/pool-provider";
import { uniswapV3PoolProviders } from "./uniswap-v3/pool-provider";

// Register pool data providers
protocolRegistry.registerPoolProvider(aerodromePoolProvider);
protocolRegistry.registerPoolProvider(velodromePoolProvider);

for (const provider of Object.values(uniswapV3PoolProviders)) {
  protocolRegistry.registerPoolProvider(provider);
}

export { protocolRegistry };
