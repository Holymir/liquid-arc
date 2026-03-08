// Aerodrome / Velodrome contract ABI fragments

// ── LP Sugar v3 ──────────────────────────────────────────────────────────────
// View-only aggregator that returns all positions (staked + unstaked) for an
// address across every Aerodrome pool in one call.
// Deployed at: 0x3058f92ebf83e2536f2084f20f7c0357d7d3ccfe (Base mainnet)
export const LP_SUGAR_ADDRESS =
  "0x3058f92ebf83e2536f2084f20f7c0357d7d3ccfe" as const;

// Both Aerodrome CL factory addresses on Base.
// The general positions() call misses old-factory pools; positionsByFactory()
// called once per factory is the reliable approach.
export const CL_FACTORY_OLD = "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A" as const;
export const CL_FACTORY_NEW = "0xaDe65c38CD4849aDBA595a4323a8C7DdfE89716a" as const;

export const LP_SUGAR_ABI = [
  {
    name: "positionsByFactory",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_limit",   type: "uint256" },
      { name: "_offset",  type: "uint256" },
      { name: "_account", type: "address" },
      { name: "_factory", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },             // NFT token-id (CL); 0 for v2
          { name: "lp", type: "address" },             // pool address
          { name: "liquidity", type: "uint256" },      // unstaked liquidity
          { name: "staked", type: "uint256" },         // staked liquidity
          { name: "amount0", type: "uint256" },        // unstaked token0 (raw)
          { name: "amount1", type: "uint256" },        // unstaked token1 (raw)
          { name: "staked0", type: "uint256" },        // staked token0 (raw)
          { name: "staked1", type: "uint256" },        // staked token1 (raw)
          { name: "unstaked_earned0", type: "uint256" },
          { name: "unstaked_earned1", type: "uint256" },
          { name: "emissions_earned", type: "uint256" },
          { name: "tick_lower", type: "int24" },
          { name: "tick_upper", type: "int24" },
          { name: "sqrt_ratio_lower", type: "uint160" },
          { name: "sqrt_ratio_upper", type: "uint160" },
          { name: "locker", type: "address" },
          { name: "unlocks_at", type: "uint32" },
          { name: "alm", type: "address" },
        ],
      },
    ],
  },
] as const;

// ── NonfungiblePositionManager (CL) ──────────────────────────────────────────
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS =
  "0x827922686190790b37229fd06084350E74485b72" as const;

export const NONFUNGIBLE_POSITION_MANAGER_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "tokenOfOwnerByIndex",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "positions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "tickSpacing", type: "int24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
  },
] as const;

// ── CL Pool ───────────────────────────────────────────────────────────────────
export const CL_POOL_ABI = [
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "slot0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "unlocked", type: "bool" },
    ],
  },
] as const;

// ── CL Factory ───────────────────────────────────────────────────────────────
export const CL_FACTORY_ADDRESS =
  "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A" as const;

export const CL_FACTORY_ABI = [
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "tickSpacing", type: "int24" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
