// ─────────────────────────────────────────
// Protocol Registry — static curated data
// ─────────────────────────────────────────

export interface ProtocolEntry {
  slug: string;
  name: string;
  description: string;
  category: "dex" | "lending" | "yield" | "bridge" | "derivatives" | "staking" | "liquid-staking";
  chains: string[];
  website: string;
  docs: string;
  twitter: string;
  riskLevel: "low" | "medium" | "high";
  audited: boolean;
  auditors: string[];
  launchYear: number;
  highlights: string[];
  supportedByLiquidArc: boolean;
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────

export const PROTOCOLS: ProtocolEntry[] = [
  // ── DEXs ──────────────────────────────
  {
    slug: "uniswap",
    name: "Uniswap",
    description:
      "The largest decentralized exchange by volume, pioneering the automated market maker model with concentrated liquidity in V3.",
    category: "dex",
    chains: ["ethereum", "base", "arbitrum", "polygon", "optimism"],
    website: "https://uniswap.org",
    docs: "https://docs.uniswap.org",
    twitter: "https://twitter.com/Uniswap",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits", "ABDK", "OpenZeppelin"],
    launchYear: 2018,
    highlights: [
      "Largest DEX by cumulative volume across all chains",
      "Concentrated liquidity (V3) enables capital-efficient LP positions",
      "Governed by UNI token holders via on-chain governance",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "aerodrome",
    name: "Aerodrome",
    description:
      "The central liquidity hub on Base, forked from Velodrome. Offers concentrated and volatile pools with AERO token emissions.",
    category: "dex",
    chains: ["base"],
    website: "https://aerodrome.finance",
    docs: "https://docs.aerodrome.finance",
    twitter: "https://twitter.com/AeurodromeFinance",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits"],
    launchYear: 2023,
    highlights: [
      "Dominant DEX on Base with the deepest liquidity across major pairs",
      "Vote-escrow tokenomics drive emissions to high-demand pools",
      "Supports both volatile and stable pool types with concentrated liquidity (Slipstream)",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "velodrome",
    name: "Velodrome",
    description:
      "The liquidity engine of Optimism, using vote-escrow tokenomics to align incentives between traders and liquidity providers.",
    category: "dex",
    chains: ["optimism"],
    website: "https://velodrome.finance",
    docs: "https://docs.velodrome.finance",
    twitter: "https://twitter.com/VelodromeFi",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits"],
    launchYear: 2022,
    highlights: [
      "Largest DEX on Optimism by TVL and volume",
      "Ve(3,3) tokenomics incentivize long-term liquidity commitment",
      "Concentrated liquidity pools (V2) for improved capital efficiency",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "curve-finance",
    name: "Curve Finance",
    description:
      "Optimized for stablecoin and pegged-asset swaps with extremely low slippage, using specialized bonding curves.",
    category: "dex",
    chains: ["ethereum", "arbitrum", "polygon"],
    website: "https://curve.fi",
    docs: "https://resources.curve.fi",
    twitter: "https://twitter.com/CurveFinance",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits", "Quantstamp", "MixBytes"],
    launchYear: 2020,
    highlights: [
      "Leading stablecoin DEX with specialized low-slippage AMM curves",
      "CRV tokenomics and vote-locking drive deep, sticky liquidity",
      "Multi-chain presence with factory pools for permissionless listing",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "pancakeswap",
    name: "PancakeSwap",
    description:
      "Originally the top DEX on BNB Chain, now multi-chain with V3 concentrated liquidity, farming, and prediction markets.",
    category: "dex",
    chains: ["bsc", "ethereum", "arbitrum"],
    website: "https://pancakeswap.finance",
    docs: "https://docs.pancakeswap.finance",
    twitter: "https://twitter.com/PancakeSwap",
    riskLevel: "low",
    audited: true,
    auditors: ["PeckShield", "SlowMist", "CertiK"],
    launchYear: 2020,
    highlights: [
      "Largest DEX on BNB Chain with billions in cumulative volume",
      "V3 concentrated liquidity with automated position management",
      "Comprehensive DeFi suite: swaps, farms, IFOs, and prediction markets",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "raydium",
    name: "Raydium",
    description:
      "A leading Solana AMM that combines an on-chain order book with automated market making for deep, efficient liquidity.",
    category: "dex",
    chains: ["solana"],
    website: "https://raydium.io",
    docs: "https://docs.raydium.io",
    twitter: "https://twitter.com/RaydiumProtocol",
    riskLevel: "medium",
    audited: true,
    auditors: ["MadShield", "Kudelski Security"],
    launchYear: 2021,
    highlights: [
      "One of the largest AMMs on Solana by volume and TVL",
      "Concentrated liquidity (CLMM) for capital-efficient positions",
      "AcceleRaytor launchpad for new Solana token launches",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "orca",
    name: "Orca",
    description:
      "A user-friendly Solana DEX focused on concentrated liquidity via Whirlpools, emphasizing simplicity and capital efficiency.",
    category: "dex",
    chains: ["solana"],
    website: "https://www.orca.so",
    docs: "https://docs.orca.so",
    twitter: "https://twitter.com/orca_so",
    riskLevel: "low",
    audited: true,
    auditors: ["Kudelski Security", "Neodyme"],
    launchYear: 2021,
    highlights: [
      "Whirlpools provide concentrated liquidity on Solana",
      "Clean, beginner-friendly UX for swaps and LP management",
      "Fair price indicator helps users avoid unfavorable trades",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "meteora",
    name: "Meteora",
    description:
      "A next-generation Solana liquidity platform featuring DLMM (Dynamic Liquidity Market Maker) bins for precise positioning.",
    category: "dex",
    chains: ["solana"],
    website: "https://www.meteora.ag",
    docs: "https://docs.meteora.ag",
    twitter: "https://twitter.com/MeteoraAG",
    riskLevel: "medium",
    audited: true,
    auditors: ["Offside Labs"],
    launchYear: 2023,
    highlights: [
      "DLMM bin-based liquidity enables zero-slippage trades within price bins",
      "Dynamic fees adjust based on market volatility",
      "Rapidly growing liquidity hub on Solana with innovative pool types",
    ],
    supportedByLiquidArc: true,
  },
  {
    slug: "sushiswap",
    name: "SushiSwap",
    description:
      "A multi-chain DEX and DeFi platform offering swaps, concentrated liquidity, and cross-chain capabilities.",
    category: "dex",
    chains: ["ethereum", "arbitrum", "polygon"],
    website: "https://www.sushi.com",
    docs: "https://docs.sushi.com",
    twitter: "https://twitter.com/SushiSwap",
    riskLevel: "medium",
    audited: true,
    auditors: ["PeckShield", "Quantstamp"],
    launchYear: 2020,
    highlights: [
      "Multi-chain DEX deployed across 25+ networks",
      "SushiXSwap enables cross-chain token swaps",
      "Trident framework allows custom pool type development",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "trader-joe",
    name: "Trader Joe",
    description:
      "A leading DEX on Avalanche and Arbitrum featuring the Liquidity Book AMM with discrete bin-based liquidity.",
    category: "dex",
    chains: ["avalanche", "arbitrum"],
    website: "https://traderjoexyz.com",
    docs: "https://docs.traderjoexyz.com",
    twitter: "https://twitter.com/tradaborjoe",
    riskLevel: "medium",
    audited: true,
    auditors: ["Omniscia", "Consensys Diligence"],
    launchYear: 2021,
    highlights: [
      "Liquidity Book V2 uses discrete bins for concentrated liquidity",
      "Auto-pools simplify LP management with built-in rebalancing",
      "Dominant DEX on Avalanche with significant Arbitrum presence",
    ],
    supportedByLiquidArc: false,
  },

  // ── Lending ───────────────────────────
  {
    slug: "aave",
    name: "Aave",
    description:
      "The largest decentralized lending protocol, enabling users to lend and borrow crypto assets across multiple networks.",
    category: "lending",
    chains: ["ethereum", "arbitrum", "polygon", "optimism", "base"],
    website: "https://aave.com",
    docs: "https://docs.aave.com",
    twitter: "https://twitter.com/aaborve",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits", "OpenZeppelin", "SigmaPrime", "Certora"],
    launchYear: 2020,
    highlights: [
      "Largest lending protocol by TVL with billions in deposits",
      "Flash loans, rate switching, and isolation mode for risk management",
      "V3 introduces cross-chain portals and efficiency mode (eMode)",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "compound",
    name: "Compound",
    description:
      "A pioneering lending protocol that introduced algorithmic interest rates, now running V3 (Comet) with improved risk controls.",
    category: "lending",
    chains: ["ethereum", "base"],
    website: "https://compound.finance",
    docs: "https://docs.compound.finance",
    twitter: "https://twitter.com/compoundfinance",
    riskLevel: "low",
    audited: true,
    auditors: ["Trail of Bits", "OpenZeppelin", "ChainSecurity"],
    launchYear: 2018,
    highlights: [
      "Pioneer of on-chain lending with algorithmic interest rates",
      "Comet (V3) focuses on single-borrow-asset markets for improved safety",
      "One of the most forked DeFi protocols in history",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "morpho",
    name: "Morpho",
    description:
      "A lending protocol optimizer that matches lenders and borrowers peer-to-peer for improved rates, built on top of Aave and Compound.",
    category: "lending",
    chains: ["ethereum", "base"],
    website: "https://morpho.org",
    docs: "https://docs.morpho.org",
    twitter: "https://twitter.com/MorphoLabs",
    riskLevel: "medium",
    audited: true,
    auditors: ["Spearbit", "Trail of Bits"],
    launchYear: 2022,
    highlights: [
      "Peer-to-peer matching layer improves rates for both lenders and borrowers",
      "Morpho Blue introduces permissionless, isolated lending markets",
      "MetaMorpho vaults enable curated lending strategies",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "spark",
    name: "Spark",
    description:
      "The lending arm of MakerDAO (Sky), offering DAI borrowing with competitive rates and deep integration with the Maker ecosystem.",
    category: "lending",
    chains: ["ethereum"],
    website: "https://spark.fi",
    docs: "https://docs.spark.fi",
    twitter: "https://twitter.com/sparkdotfi",
    riskLevel: "low",
    audited: true,
    auditors: ["ChainSecurity", "Cantina"],
    launchYear: 2023,
    highlights: [
      "Native DAI borrowing at the Dai Savings Rate, often the cheapest in DeFi",
      "Deep integration with MakerDAO for robust risk parameters",
      "sDAI provides a yield-bearing stablecoin for lenders",
    ],
    supportedByLiquidArc: false,
  },

  // ── Yield ─────────────────────────────
  {
    slug: "yearn-finance",
    name: "Yearn Finance",
    description:
      "An automated yield aggregator that deploys capital into the highest-yielding DeFi strategies across lending, LP, and more.",
    category: "yield",
    chains: ["ethereum"],
    website: "https://yearn.fi",
    docs: "https://docs.yearn.fi",
    twitter: "https://twitter.com/yeaborrnfi",
    riskLevel: "medium",
    audited: true,
    auditors: ["Trail of Bits", "ChainSecurity", "Statemind"],
    launchYear: 2020,
    highlights: [
      "Automated vaults execute complex yield strategies hands-free",
      "V3 vault architecture enables modular, composable strategies",
      "Battle-tested through multiple market cycles since 2020",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "convex-finance",
    name: "Convex Finance",
    description:
      "A yield booster for Curve and Frax liquidity providers, aggregating CRV voting power to maximize pool rewards.",
    category: "yield",
    chains: ["ethereum"],
    website: "https://www.convexfinance.com",
    docs: "https://docs.convexfinance.com",
    twitter: "https://twitter.com/ConvexFinance",
    riskLevel: "medium",
    audited: true,
    auditors: ["MixBytes", "PeckShield"],
    launchYear: 2021,
    highlights: [
      "Largest holder of veCRV, boosting yields for Curve LPs",
      "Eliminates the need for individual CRV locking and voting",
      "CVX token enables governance over massive DeFi liquidity flows",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "pendle",
    name: "Pendle",
    description:
      "A yield trading protocol that tokenizes future yield, enabling users to trade and hedge yield exposure.",
    category: "yield",
    chains: ["ethereum", "arbitrum"],
    website: "https://www.pendle.finance",
    docs: "https://docs.pendle.finance",
    twitter: "https://twitter.com/penabordle_fi",
    riskLevel: "medium",
    audited: true,
    auditors: ["Ackee Blockchain", "Dedaub"],
    launchYear: 2021,
    highlights: [
      "Tokenizes yield into principal (PT) and yield (YT) components",
      "Enables fixed-rate positions and yield speculation",
      "V2 AMM designed specifically for yield token trading with minimal IL",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "beefy-finance",
    name: "Beefy Finance",
    description:
      "A multi-chain yield optimizer that auto-compounds farming rewards across hundreds of DeFi protocols and chains.",
    category: "yield",
    chains: ["ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "base"],
    website: "https://beefy.com",
    docs: "https://docs.beefy.finance",
    twitter: "https://twitter.com/beaborefyfinance",
    riskLevel: "medium",
    audited: true,
    auditors: ["Certik", "Zellic"],
    launchYear: 2020,
    highlights: [
      "Deployed across 20+ chains with hundreds of auto-compounding vaults",
      "Automated compounding maximizes yield without manual intervention",
      "Safety scoring system rates vault risk for informed decision-making",
    ],
    supportedByLiquidArc: false,
  },

  // ── Liquid Staking ────────────────────
  {
    slug: "lido",
    name: "Lido",
    description:
      "The largest liquid staking protocol, allowing users to stake ETH while receiving stETH, a liquid and composable staking token.",
    category: "liquid-staking",
    chains: ["ethereum"],
    website: "https://lido.fi",
    docs: "https://docs.lido.fi",
    twitter: "https://twitter.com/LidoFinance",
    riskLevel: "low",
    audited: true,
    auditors: ["Quantstamp", "MixBytes", "Sigma Prime", "Statemind"],
    launchYear: 2020,
    highlights: [
      "Largest liquid staking protocol with millions of ETH staked",
      "stETH is deeply integrated across DeFi as collateral and LP asset",
      "Distributed validator set with multiple professional node operators",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "rocket-pool",
    name: "Rocket Pool",
    description:
      "A decentralized Ethereum staking protocol enabling permissionless node operation with just 8 ETH and issuing rETH.",
    category: "liquid-staking",
    chains: ["ethereum"],
    website: "https://rocketpool.net",
    docs: "https://docs.rocketpool.net",
    twitter: "https://twitter.com/Rocket_Pool",
    riskLevel: "low",
    audited: true,
    auditors: ["Sigma Prime", "Consensys Diligence", "Trail of Bits"],
    launchYear: 2021,
    highlights: [
      "Most decentralized liquid staking with permissionless node operators",
      "rETH accrues staking rewards automatically via exchange rate appreciation",
      "Minipool design lowers the barrier to solo staking from 32 to 8 ETH",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "jito",
    name: "Jito",
    description:
      "A Solana liquid staking protocol that captures MEV rewards for stakers, distributing them via JitoSOL.",
    category: "liquid-staking",
    chains: ["solana"],
    website: "https://www.jito.network",
    docs: "https://docs.jito.network",
    twitter: "https://twitter.com/jaborito_sol",
    riskLevel: "medium",
    audited: true,
    auditors: ["Neodyme", "Otter Security"],
    launchYear: 2022,
    highlights: [
      "Captures MEV rewards on top of standard Solana staking yield",
      "JitoSOL is widely used as collateral across Solana DeFi",
      "Validator client optimizations improve Solana network efficiency",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "marinade-finance",
    name: "Marinade Finance",
    description:
      "The original Solana liquid staking protocol, distributing stake across hundreds of validators for decentralization.",
    category: "liquid-staking",
    chains: ["solana"],
    website: "https://marinade.finance",
    docs: "https://docs.marinade.finance",
    twitter: "https://twitter.com/MarinadeFinance",
    riskLevel: "low",
    audited: true,
    auditors: ["Neodyme", "Ackee Blockchain"],
    launchYear: 2021,
    highlights: [
      "Distributes stake across 400+ validators for maximum decentralization",
      "mSOL liquid staking token is deeply integrated in Solana DeFi",
      "Native staking option allows direct validator delegation with rewards",
    ],
    supportedByLiquidArc: false,
  },

  // ── Bridges ───────────────────────────
  {
    slug: "stargate",
    name: "Stargate",
    description:
      "A cross-chain bridge built on LayerZero, enabling native asset transfers with unified liquidity pools across chains.",
    category: "bridge",
    chains: ["ethereum", "arbitrum", "optimism", "polygon", "base", "avalanche", "bsc"],
    website: "https://stargate.finance",
    docs: "https://stargateprotocol.gitbook.io",
    twitter: "https://twitter.com/StargateFinance",
    riskLevel: "medium",
    audited: true,
    auditors: ["Quantstamp", "Zellic"],
    launchYear: 2022,
    highlights: [
      "Unified liquidity pools enable instant guaranteed finality transfers",
      "Built on LayerZero for secure cross-chain messaging",
      "Supports native assets rather than wrapped tokens for reduced risk",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "across-protocol",
    name: "Across Protocol",
    description:
      "An optimistic cross-chain bridge using relayers for fast transfers, with UMA's optimistic oracle for dispute resolution.",
    category: "bridge",
    chains: ["ethereum", "arbitrum", "optimism", "polygon", "base"],
    website: "https://across.to",
    docs: "https://docs.across.to",
    twitter: "https://twitter.com/AcrossProtocol",
    riskLevel: "medium",
    audited: true,
    auditors: ["OpenZeppelin"],
    launchYear: 2022,
    highlights: [
      "Fastest bridge for L2-to-L1 transfers using relayer competition",
      "Optimistic verification via UMA oracle reduces costs and latency",
      "Capital-efficient design with competitive relayer marketplace",
    ],
    supportedByLiquidArc: false,
  },

  // ── Derivatives ───────────────────────
  {
    slug: "gmx",
    name: "GMX",
    description:
      "A decentralized perpetual exchange offering up to 100x leverage with deep liquidity via the GLP/GM pool model.",
    category: "derivatives",
    chains: ["arbitrum", "avalanche"],
    website: "https://gmx.io",
    docs: "https://docs.gmx.io",
    twitter: "https://twitter.com/GMX_IO",
    riskLevel: "high",
    audited: true,
    auditors: ["ABDK", "Guardrails"],
    launchYear: 2021,
    highlights: [
      "Leading on-chain perpetuals exchange with billions in volume",
      "GM pools allow LPs to earn from trading fees and liquidations",
      "Zero price impact trades via Chainlink oracle price feeds",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "hyperliquid",
    name: "Hyperliquid",
    description:
      "A high-performance perpetuals DEX running on its own L1 chain, offering CEX-like speed with on-chain transparency.",
    category: "derivatives",
    chains: ["hyperliquid"],
    website: "https://hyperliquid.xyz",
    docs: "https://hyperliquid.gitbook.io",
    twitter: "https://twitter.com/HyperliquidX",
    riskLevel: "high",
    audited: true,
    auditors: ["Zellic"],
    launchYear: 2023,
    highlights: [
      "Custom L1 delivers sub-second block times and 100k+ orders per second",
      "Fully on-chain order book with CEX-comparable UX and latency",
      "HLP vault enables passive market-making for liquidity providers",
    ],
    supportedByLiquidArc: false,
  },
  {
    slug: "dydx",
    name: "dYdX",
    description:
      "A decentralized derivatives exchange running on its own Cosmos appchain, offering perpetual trading with a full order book.",
    category: "derivatives",
    chains: ["dydx-chain"],
    website: "https://dydx.exchange",
    docs: "https://docs.dydx.exchange",
    twitter: "https://twitter.com/dYdX",
    riskLevel: "medium",
    audited: true,
    auditors: ["Trail of Bits", "Informal Systems"],
    launchYear: 2019,
    highlights: [
      "Dedicated Cosmos appchain enables fully decentralized order book matching",
      "V4 eliminates off-chain components for complete on-chain operation",
      "Trading fee revenue distributed to DYDX stakers",
    ],
    supportedByLiquidArc: false,
  },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

export function getProtocolBySlug(slug: string): ProtocolEntry | undefined {
  return PROTOCOLS.find((p) => p.slug === slug);
}

export function getProtocolsByCategory(category: string): ProtocolEntry[] {
  return PROTOCOLS.filter((p) => p.category === category);
}

export function getCategories(): string[] {
  return [...new Set(PROTOCOLS.map((p) => p.category))];
}
