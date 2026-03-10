// Velodrome V2 (Optimism) contract ABI fragments
// Velodrome is the original — Aerodrome on Base is its fork.
// Same Sugar contract pattern, different addresses.

export const VELO_LP_SUGAR_ADDRESS =
  "0x6dA7F1d26e04F65Bbe5442017b21ABd2a26B5F1b" as const;

// Velodrome CL factory on Optimism
export const VELO_CL_FACTORY = "0xCc0bDDB707055e04e497aB22a59c2aF4391cd12F" as const;

export const VELO_LP_SUGAR_ABI = [
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
          { name: "id", type: "uint256" },
          { name: "lp", type: "address" },
          { name: "liquidity", type: "uint256" },
          { name: "staked", type: "uint256" },
          { name: "amount0", type: "uint256" },
          { name: "amount1", type: "uint256" },
          { name: "staked0", type: "uint256" },
          { name: "staked1", type: "uint256" },
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

export const VELO_CL_POOL_ABI = [
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
] as const;
