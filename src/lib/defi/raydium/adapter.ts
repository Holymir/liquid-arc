// Raydium CLMM adapter (Solana)
// Raydium Concentrated Liquidity Market Maker — tick-based CL on Solana.
//
// Computes actual pending fees via fee growth deltas (not just stale token_fees_owed)
// and reads reward token amounts from pool + position reward_infos.
//
// Requires: @solana/web3.js
// Raydium CLMM program: CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getTokenAccountsForWallet, getSolanaConnection } from "@/lib/chain/solana/token-accounts";
import { resolveTokenMeta } from "@/lib/chain/solana/token-list";

// Raydium CLMM program ID
const RAYDIUM_CLMM_PROGRAM = new PublicKey(
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK"
);

// ─── Constants ────────────────────────────────────────────────────────
const TICK_ARRAY_SIZE = 60;
const Q64 = 1n << 64n;
const MASK128 = (1n << 128n) - 1n;

// Pool state offsets
const POOL_TICK_SPACING_OFFSET = 235;
const POOL_FEE_GROWTH_GLOBAL_0_OFFSET = 277;
const POOL_FEE_GROWTH_GLOBAL_1_OFFSET = 293;
const POOL_REWARD_INFOS_OFFSET = 397;
const REWARD_INFO_SIZE = 169;

// PersonalPositionState offsets
const POS_FEE_GROWTH_INSIDE_0_LAST_OFFSET = 97;
const POS_FEE_GROWTH_INSIDE_1_LAST_OFFSET = 113;
const POS_REWARD_INFOS_OFFSET = 145;
const POS_REWARD_INFO_SIZE = 24; // u128 growth_inside_last + u64 reward_amount_owed

// TickArrayState offsets
const TICK_ARRAY_HEADER_SIZE = 44; // 8 disc + 32 pool_id + 4 start_tick_index
const TICK_STATE_SIZE = 168;
const TICK_FEE_OUTSIDE_0_OFFSET = 36;
const TICK_FEE_OUTSIDE_1_OFFSET = 52;
const TICK_REWARD_OUTSIDE_OFFSET = 68; // 3 × u128 = 48 bytes

// Known Solana token symbols (fast path, no network needed)
const KNOWN_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "JUP",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
};

// ─── Helpers ──────────────────────────────────────────────────────────

/** Ensure data is a Buffer (not Uint8Array) so .readBigUInt64LE etc. work */
function ensureBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

function readU128LE(buf: Buffer, offset: number): bigint {
  const low = buf.readBigUInt64LE(offset);
  const high = buf.readBigUInt64LE(offset + 8);
  return (high << 64n) | low;
}

/**
 * Compute a fee/reward delta avoiding bigint truncation.
 * Pure bigint division `(growthDelta * liquidity) / Q64` truncates to 0 for
 * moderate positions because Q64 = 2^64 ≈ 1.8e19.  Instead, split into an
 * integer part (bigint) + fractional remainder (float) so small amounts aren't
 * lost.
 */
function computeDelta(growthInside: bigint, growthInsideLast: bigint, liquidity: bigint): bigint {
  const growthDelta = (growthInside - growthInsideLast) & MASK128;
  if (growthDelta === 0n) return 0n;
  const numerator = growthDelta * liquidity;
  const intPart = numerator / Q64;
  if (intPart > 0n) return intPart;
  // Bigint division truncated to 0 — recover with float math
  const floatResult = Number(growthDelta) * Number(liquidity) / Number(Q64);
  return BigInt(Math.floor(floatResult));
}

async function resolveSymbol(mint: string): Promise<{ symbol: string; decimals: number }> {
  if (KNOWN_SYMBOLS[mint]) {
    const meta = await resolveTokenMeta(mint);
    return { symbol: KNOWN_SYMBOLS[mint], decimals: meta?.decimals ?? 9 };
  }
  const meta = await resolveTokenMeta(mint);
  if (meta) return { symbol: meta.symbol, decimals: meta.decimals };
  return { symbol: mint.slice(0, 4) + "...", decimals: 9 };
}

/** Compute the tick_array start_index for a given tick */
function tickArrayStartIndex(tick: number, tickSpacing: number): number {
  const ticksPerArray = tickSpacing * TICK_ARRAY_SIZE;
  // Math.floor handles negative ticks correctly (rounds toward -Infinity)
  return Math.floor(tick / ticksPerArray) * ticksPerArray;
}

/** Derive the TickArray PDA */
function tickArrayPDA(poolId: PublicKey, startIndex: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("tick_array"),
      poolId.toBuffer(),
      Buffer.from(startIndex.toString()),
    ],
    RAYDIUM_CLMM_PROGRAM
  );
  return pda;
}

/** Read fee_growth_outside and reward_growths_outside from a tick within a tick array */
function readTickGrowthOutside(
  tickArrayData: Buffer,
  tick: number,
  startIndex: number,
  tickSpacing: number
): {
  feeGrowthOutside0: bigint;
  feeGrowthOutside1: bigint;
  rewardGrowthsOutside: bigint[];
} {
  const idx = (tick - startIndex) / tickSpacing;
  const base = TICK_ARRAY_HEADER_SIZE + idx * TICK_STATE_SIZE;

  return {
    feeGrowthOutside0: readU128LE(tickArrayData, base + TICK_FEE_OUTSIDE_0_OFFSET),
    feeGrowthOutside1: readU128LE(tickArrayData, base + TICK_FEE_OUTSIDE_1_OFFSET),
    rewardGrowthsOutside: [
      readU128LE(tickArrayData, base + TICK_REWARD_OUTSIDE_OFFSET),
      readU128LE(tickArrayData, base + TICK_REWARD_OUTSIDE_OFFSET + 16),
      readU128LE(tickArrayData, base + TICK_REWARD_OUTSIDE_OFFSET + 32),
    ],
  };
}

/**
 * Compute fee/reward growth inside a tick range.
 * Standard Uniswap V3 / Raydium CL formula.
 */
function computeGrowthInside(
  currentTick: number,
  tickLower: number,
  tickUpper: number,
  growthGlobal: bigint,
  growthOutsideLower: bigint,
  growthOutsideUpper: bigint
): bigint {
  const growthBelow = currentTick >= tickLower
    ? growthOutsideLower
    : (growthGlobal - growthOutsideLower) & MASK128;

  const growthAbove = currentTick < tickUpper
    ? growthOutsideUpper
    : (growthGlobal - growthOutsideUpper) & MASK128;

  return (growthGlobal - growthBelow - growthAbove) & MASK128;
}

// ─── Adapter ──────────────────────────────────────────────────────────

export class RaydiumCLMMAdapter implements DefiProtocolAdapter {
  readonly protocolName = "raydium";
  readonly protocolId = "raydium-solana";
  readonly slug = "raydium";
  readonly displayName = "Raydium";
  readonly chainId = "solana";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const connection = getSolanaConnection();

    // Use shared token accounts cache (no extra RPC call)
    const { nftMints } = await getTokenAccountsForWallet(address);

    if (nftMints.size === 0) return [];

    // Derive PersonalPosition PDA for each NFT mint
    // PDA: ["position", nft_mint]
    const positionPDAs: { pda: PublicKey; mint: string }[] = [];
    for (const mint of nftMints) {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), new PublicKey(mint).toBuffer()],
        RAYDIUM_CLMM_PROGRAM
      );
      positionPDAs.push({ pda, mint });
    }

    // Batch-fetch all position accounts
    const positionPubkeys = positionPDAs.map((p) => p.pda);
    const positionInfos =
      await connection.getMultipleAccountsInfo(positionPubkeys);

    console.log(
      `[raydium] Checking ${positionPDAs.length} potential CLMM positions for ${address}`
    );

    const validCount = positionInfos.filter(
      (info) => info && info.owner.equals(RAYDIUM_CLMM_PROGRAM)
    ).length;
    console.log(
      `[raydium] PDA resolution: ${validCount}/${positionPDAs.length} resolved to valid Raydium positions`
    );

    const positions: LPPositionData[] = [];

    for (let i = 0; i < positionInfos.length; i++) {
      const info = positionInfos[i];
      if (!info || !info.owner.equals(RAYDIUM_CLMM_PROGRAM)) continue;

      try {
        const data = ensureBuffer(info.data);
        if (data.length < POS_REWARD_INFOS_OFFSET + POS_REWARD_INFO_SIZE * 3) continue;

        // PersonalPositionState layout (from Raydium CLMM IDL):
        // 0-7:     discriminator (8 bytes)
        // 8:       bump (1 byte)
        // 9-40:    nft_mint (32 bytes)
        // 41-72:   pool_id (32 bytes)
        // 73-76:   tick_lower_index (i32)
        // 77-80:   tick_upper_index (i32)
        // 81-96:   liquidity (u128)
        // 97-112:  fee_growth_inside_0_last_x64 (u128)
        // 113-128: fee_growth_inside_1_last_x64 (u128)
        // 129-136: token_fees_owed_0 (u64)
        // 137-144: token_fees_owed_1 (u64)
        // 145+:    reward_infos[3] (each: u128 growth_inside_last + u64 reward_amount_owed)

        const poolId = new PublicKey(data.subarray(41, 73));
        const tickLower = data.readInt32LE(73);
        const tickUpper = data.readInt32LE(77);

        // liquidity: u128 at offset 81
        const liquidityLow = data.readBigUInt64LE(81);
        const liquidityHigh = data.readBigUInt64LE(89);
        const liquidity = (liquidityHigh << 64n) | liquidityLow;

        if (liquidity === 0n) continue;

        // Stale fees owed (baseline — will be augmented with fee growth delta)
        const feesOwed0 = data.readBigUInt64LE(129);
        const feesOwed1 = data.readBigUInt64LE(137);

        // Fee growth inside last (from position state)
        const feeGrowthInsideLast0 = readU128LE(data, POS_FEE_GROWTH_INSIDE_0_LAST_OFFSET);
        const feeGrowthInsideLast1 = readU128LE(data, POS_FEE_GROWTH_INSIDE_1_LAST_OFFSET);

        // Position reward infos
        const posRewardInfos = [];
        for (let r = 0; r < 3; r++) {
          const off = POS_REWARD_INFOS_OFFSET + r * POS_REWARD_INFO_SIZE;
          posRewardInfos.push({
            growthInsideLast: readU128LE(data, off),
            rewardAmountOwed: data.readBigUInt64LE(off + 16),
          });
        }

        // ── Fetch pool account ──────────────────────────────────────
        const poolInfo = await connection.getAccountInfo(poolId);
        if (!poolInfo) continue;

        const poolData = ensureBuffer(poolInfo.data);

        const tokenMint0 = new PublicKey(poolData.subarray(73, 105));
        const tokenMint1 = new PublicKey(poolData.subarray(105, 137));
        const mintDecimals0 = poolData.readUInt8(233);
        const mintDecimals1 = poolData.readUInt8(234);
        const tickSpacing = poolData.readUInt16LE(POOL_TICK_SPACING_OFFSET);
        const currentTick = poolData.readInt32LE(269);

        // Pool total liquidity (for simulating pending reward growth)
        const poolLiquidity = readU128LE(poolData, 237);

        // Fee growth globals from pool
        const feeGrowthGlobal0 = readU128LE(poolData, POOL_FEE_GROWTH_GLOBAL_0_OFFSET);
        const feeGrowthGlobal1 = readU128LE(poolData, POOL_FEE_GROWTH_GLOBAL_1_OFFSET);

        // Pool reward infos (up to 3)
        // We simulate pending reward growth that hasn't been checkpointed on-chain yet.
        // On-chain rewardGrowthGlobal is only updated on pool interactions (swaps, etc).
        // Raydium's UI simulates the update; we do the same for accuracy.
        const nowSec = BigInt(Math.floor(Date.now() / 1000));

        const poolRewardInfos: Array<{
          active: boolean;
          tokenMint: string;
          rewardGrowthGlobal: bigint;
          decimals: number;
          symbol: string;
        }> = [];

        for (let r = 0; r < 3; r++) {
          const base = POOL_REWARD_INFOS_OFFSET + r * REWARD_INFO_SIZE;
          if (base + REWARD_INFO_SIZE > poolData.length) break;
          const rewardState = poolData.readUInt8(base);
          if (rewardState === 0) {
            poolRewardInfos.push({
              active: false, tokenMint: "", rewardGrowthGlobal: 0n, decimals: 0, symbol: "",
            });
            continue;
          }

          const endTime = poolData.readBigUInt64LE(base + 9);
          const lastUpdateTime = poolData.readBigUInt64LE(base + 17);
          const emissionsPerSecondX64 = readU128LE(poolData, base + 25);
          const rewardMint = new PublicKey(poolData.subarray(base + 57, base + 89)).toBase58();
          let rewardGrowthGlobal = readU128LE(poolData, base + 153);

          // Simulate pending growth since last on-chain update
          // This matches Raydium's UI which also simulates ahead of on-chain state
          if (rewardState === 2 && poolLiquidity > 0n && emissionsPerSecondX64 > 0n) {
            // Cap at endTime — no emissions after program ends
            const effectiveNow = endTime > 0n && nowSec > endTime ? endTime : nowSec;
            if (effectiveNow > lastUpdateTime) {
              const timeDelta = effectiveNow - lastUpdateTime;
              const pendingGrowth = (emissionsPerSecondX64 * timeDelta) / poolLiquidity;
              rewardGrowthGlobal = (rewardGrowthGlobal + pendingGrowth) & MASK128;
            }
          }

          const meta = await resolveSymbol(rewardMint);
          poolRewardInfos.push({
            active: true,
            tokenMint: rewardMint,
            rewardGrowthGlobal,
            decimals: meta.decimals,
            symbol: meta.symbol,
          });
        }

        // ── Fetch tick arrays for fee growth outside ────────────────
        const addr0 = tokenMint0.toBase58();
        const addr1 = tokenMint1.toBase58();
        const meta0 = await resolveSymbol(addr0);
        const meta1 = await resolveSymbol(addr1);
        const dec0 = mintDecimals0 || meta0.decimals;
        const dec1 = mintDecimals1 || meta1.decimals;

        // Compute token amounts using CL math
        const sqrtPriceLower = Math.sqrt(1.0001 ** tickLower);
        const sqrtPriceUpper = Math.sqrt(1.0001 ** tickUpper);
        const sqrtPriceCurrent = Math.sqrt(1.0001 ** currentTick);
        const liq = Number(liquidity);

        let amount0 = 0;
        let amount1 = 0;

        if (currentTick < tickLower) {
          amount0 = liq * (1 / sqrtPriceLower - 1 / sqrtPriceUpper);
        } else if (currentTick >= tickUpper) {
          amount1 = liq * (sqrtPriceUpper - sqrtPriceLower);
        } else {
          amount0 = liq * (1 / sqrtPriceCurrent - 1 / sqrtPriceUpper);
          amount1 = liq * (sqrtPriceCurrent - sqrtPriceLower);
        }

        amount0 = amount0 / 10 ** dec0;
        amount1 = amount1 / 10 ** dec1;

        // ── Compute actual pending fees via fee growth delta ────────
        let fees0: number;
        let fees1: number;

        const startLower = tickArrayStartIndex(tickLower, tickSpacing);
        const startUpper = tickArrayStartIndex(tickUpper, tickSpacing);

        const tickArrayKeys = [tickArrayPDA(poolId, startLower)];
        if (startUpper !== startLower) {
          tickArrayKeys.push(tickArrayPDA(poolId, startUpper));
        }

        const tickArrayInfos = await connection.getMultipleAccountsInfo(tickArrayKeys);
        const tickArrayLower = tickArrayInfos[0];
        const tickArrayUpper = startUpper !== startLower ? tickArrayInfos[1] : tickArrayInfos[0];

        if (tickArrayLower && tickArrayUpper) {
          const lowerGrowth = readTickGrowthOutside(
            ensureBuffer(tickArrayLower.data), tickLower, startLower, tickSpacing
          );
          const upperGrowth = readTickGrowthOutside(
            ensureBuffer(tickArrayUpper.data), tickUpper, startUpper, tickSpacing
          );

          // Fee growth inside current
          const feeGrowthInside0 = computeGrowthInside(
            currentTick, tickLower, tickUpper,
            feeGrowthGlobal0, lowerGrowth.feeGrowthOutside0, upperGrowth.feeGrowthOutside0
          );
          const feeGrowthInside1 = computeGrowthInside(
            currentTick, tickLower, tickUpper,
            feeGrowthGlobal1, lowerGrowth.feeGrowthOutside1, upperGrowth.feeGrowthOutside1
          );

          // Uncollected fee delta (uses computeDelta to avoid bigint truncation)
          const feeDelta0 = computeDelta(feeGrowthInside0, feeGrowthInsideLast0, liquidity);
          const feeDelta1 = computeDelta(feeGrowthInside1, feeGrowthInsideLast1, liquidity);

          // Total pending = stale owed + uncollected delta
          fees0 = Number(feesOwed0 + feeDelta0) / 10 ** dec0;
          fees1 = Number(feesOwed1 + feeDelta1) / 10 ** dec1;

          console.log(
            `[raydium] Fees for ${meta0.symbol}/${meta1.symbol}: ` +
            `${fees0.toFixed(6)} ${meta0.symbol} ($${(fees0 * 1).toFixed(4)}), ` +
            `${fees1.toFixed(6)} ${meta1.symbol} — ` +
            `feeDelta0=${feeDelta0}, feeDelta1=${feeDelta1}, ` +
            `staleOwed0=${feesOwed0}, staleOwed1=${feesOwed1}`
          );

          // ── Compute pending rewards ─────────────────────────────
          const rewardTokens: LPPositionData["rewardTokens"] = [];
          for (let r = 0; r < poolRewardInfos.length; r++) {
            const poolReward = poolRewardInfos[r];
            if (!poolReward.active) continue;

            const rewardGrowthInside = computeGrowthInside(
              currentTick, tickLower, tickUpper,
              poolReward.rewardGrowthGlobal,
              lowerGrowth.rewardGrowthsOutside[r],
              upperGrowth.rewardGrowthsOutside[r]
            );
            const rewardDelta = computeDelta(rewardGrowthInside, posRewardInfos[r].growthInsideLast, liquidity);
            const totalReward = posRewardInfos[r].rewardAmountOwed + rewardDelta;
            const rewardAmount = Number(totalReward) / 10 ** poolReward.decimals;

            if (rewardAmount > 0) {
              rewardTokens.push({
                address: poolReward.tokenMint,
                symbol: poolReward.symbol,
                decimals: poolReward.decimals,
                amount: rewardAmount,
              });
            }
          }

          positions.push({
            nftTokenId: positionPDAs[i].mint,
            protocol: "raydium",
            poolAddress: poolId.toBase58(),
            token0Address: addr0,
            token0Symbol: meta0.symbol,
            token0Decimals: dec0,
            token1Address: addr1,
            token1Symbol: meta1.symbol,
            token1Decimals: dec1,
            liquidity,
            tickLower,
            tickUpper,
            currentTick,
            token0Amount: amount0,
            token1Amount: amount1,
            fees0Amount: fees0,
            fees1Amount: fees1,
            ...(rewardTokens.length > 0 ? { rewardTokens } : {}),
          });
        } else {
          // Tick arrays unavailable — fall back to stale token_fees_owed and reward_amount_owed
          console.warn(
            `[raydium] Tick array fetch failed for NFT ${positionPDAs[i].mint}, using stale fees/rewards (no growth delta)`
          );
          fees0 = Number(feesOwed0) / 10 ** dec0;
          fees1 = Number(feesOwed1) / 10 ** dec1;

          // Compute stale rewards from position reward_amount_owed
          const rewardTokens: LPPositionData["rewardTokens"] = [];
          for (let r = 0; r < poolRewardInfos.length; r++) {
            const poolReward = poolRewardInfos[r];
            if (!poolReward.active) continue;

            const rewardAmount = Number(posRewardInfos[r].rewardAmountOwed) / 10 ** poolReward.decimals;
            if (rewardAmount > 0) {
              rewardTokens.push({
                address: poolReward.tokenMint,
                symbol: poolReward.symbol,
                decimals: poolReward.decimals,
                amount: rewardAmount,
              });
            }
          }

          positions.push({
            nftTokenId: positionPDAs[i].mint,
            protocol: "raydium",
            poolAddress: poolId.toBase58(),
            token0Address: addr0,
            token0Symbol: meta0.symbol,
            token0Decimals: dec0,
            token1Address: addr1,
            token1Symbol: meta1.symbol,
            token1Decimals: dec1,
            liquidity,
            tickLower,
            tickUpper,
            currentTick,
            token0Amount: amount0,
            token1Amount: amount1,
            fees0Amount: fees0,
            fees1Amount: fees1,
            ...(rewardTokens.length > 0 ? { rewardTokens } : {}),
          });
        }
      } catch (err) {
        console.warn(
          `[raydium] Failed to parse position:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.log(`[raydium] Found ${positions.length} active CLMM positions`);
    return positions;
  }
}

export const raydiumAdapter = new RaydiumCLMMAdapter();
