// Protocol registration — import this to ensure all adapters are registered

import { protocolRegistry } from "./registry";
import { aerodromePoolProvider } from "./aerodrome/pool-provider";

// Register pool data providers
protocolRegistry.registerPoolProvider(aerodromePoolProvider);

// Future:
// protocolRegistry.registerPoolProvider(velodromePoolProvider);
// protocolRegistry.registerPoolProvider(uniswapV3BasePoolProvider);

export { protocolRegistry };
