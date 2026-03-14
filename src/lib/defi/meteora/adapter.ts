// Meteora DLMM adapter (Solana)
//
// Discovers positions via getProgramAccounts with the correct account sizes
// from the Meteora DLMM IDL. Supports both Position V1 (7560 bytes) and
// PositionV2 (8120 bytes). Uses shared Solana connection + pair metadata
// from the Meteora REST API.

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/chain/solana/token-accounts";
import { resolveTokenMeta } from "@/lib/chain/solana/token-list";

// Meteora DLMM program ID
const METEORA_DLMM_PROGRAM = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
);

// Account sizes from IDL (discriminator + fields)
// FeeInfo = 48 bytes (u128+u128+u64+u64), UserRewardInfo = 48 bytes (u128[2]+u64[2])
// V1: 8 + 32 + 32 + 560(u64[70]) + 3360(UserRewardInfo[70]) + 3360(FeeInfo[70]) + 4+4+8+8+8+16+160 = 7560
// V2: 8 + 32 + 32 + 1120(u128[70]) + 3360 + 3360 + 4+4+8+8+8+16+32+8+1+32+87 = 8120
const POSITION_V1_SIZE = 7560;
const POSITION_V2_SIZE = 8120;

// Discriminators from IDL
const POSITION_V1_DISC = Buffer.from([170, 188, 143, 228, 122, 64, 247, 208]);
const POSITION_V2_DISC = Buffer.from([117, 176, 212, 199, 245, 180, 133, 182]);

// Known Solana token symbols (fast path, no network needed)
const KNOWN_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "JUP",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": "stSOL",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
  orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE: "ORCA",
};

async function resolveSymbol(mint: string): Promise<string> {
  if (KNOWN_SYMBOLS[mint]) return KNOWN_SYMBOLS[mint];
  const meta = await resolveTokenMeta(mint);
  return meta?.symbol ?? mint.slice(0, 4) + "...";
}

// Pair metadata cache (from Meteora REST API)
const pairCache = new Map<string, {
  mint_x: string; mint_y: string;
  decimals_x: number; decimals_y: number;
  active_bin_id: number; bin_step: number;
}>();

async function getPairMeta(pairAddress: string) {
  const cached = pairCache.get(pairAddress);
  if (cached) return cached;

  try {
    const res = await fetch(`https://dlmm-api.meteora.ag/pair/${pairAddress}`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const data = await res.json();
      const meta = {
        mint_x: data.mint_x as string,
        mint_y: data.mint_y as string,
        decimals_x: (data.decimals_x ?? 9) as number,
        decimals_y: (data.decimals_y ?? 9) as number,
        active_bin_id: (data.active_bin_id ?? 0) as number,
        bin_step: (data.bin_step ?? 1) as number,
      };
      pairCache.set(pairAddress, meta);
      return meta;
    }
  } catch { /* fallback to on-chain */ }

  return null;
}

// ── Position parsing ─────────────────────────────────────────────────────────

interface ParsedPosition {
  pubkey: string;
  lbPair: string;
  lowerBinId: number;
  upperBinId: number;
  totalLiquidityX: bigint;
  totalLiquidityY: bigint;
  version: 1 | 2;
}

function parsePositionV1(pubkey: string, data: Buffer): ParsedPosition | null {
  if (data.length < POSITION_V1_SIZE) return null;
  if (!data.subarray(0, 8).equals(POSITION_V1_DISC)) return null;

  const lbPair = new PublicKey(data.subarray(8, 40)).toBase58();

  // liquidity_shares: u64[70] starting at offset 72
  let totalX = 0n;
  for (let i = 0; i < 70; i++) {
    totalX += data.readBigUInt64LE(72 + i * 8);
  }

  // V1 layout: 8(disc) + 32(lbPair) + 32(owner) + 560(u64[70]) + 3360(rewardInfo[70]) + 3360(feeInfo[70]) = 7352
  // lower_bin_id at offset 7352, upper_bin_id at offset 7356
  const lowerBinId = data.readInt32LE(7352);
  const upperBinId = data.readInt32LE(7356);

  return {
    pubkey,
    lbPair,
    lowerBinId,
    upperBinId,
    totalLiquidityX: totalX,
    totalLiquidityY: 0n, // V1 shares are combined
    version: 1,
  };
}

function parsePositionV2(pubkey: string, data: Buffer): ParsedPosition | null {
  if (data.length < POSITION_V2_SIZE) return null;
  if (!data.subarray(0, 8).equals(POSITION_V2_DISC)) return null;

  const lbPair = new PublicKey(data.subarray(8, 40)).toBase58();

  // liquidity_shares: u128[70] starting at offset 72
  let totalX = 0n;
  for (let i = 0; i < 70; i++) {
    const low = data.readBigUInt64LE(72 + i * 16);
    const high = data.readBigUInt64LE(72 + i * 16 + 8);
    totalX += (high << 64n) | low;
  }

  // V2 layout: 8(disc) + 32(lbPair) + 32(owner) + 1120(u128[70]) + 3360(rewardInfo[70]) + 3360(feeInfo[70]) = 7912
  // lower_bin_id at offset 7912, upper_bin_id at offset 7916
  const lowerBinId = data.readInt32LE(7912);
  const upperBinId = data.readInt32LE(7916);

  return {
    pubkey,
    lbPair,
    lowerBinId,
    upperBinId,
    totalLiquidityX: totalX,
    totalLiquidityY: 0n,
    version: 2,
  };
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export class MeteoraAdapter implements DefiProtocolAdapter {
  readonly protocolName = "meteora";
  readonly protocolId = "meteora-solana";
  readonly slug = "meteora";
  readonly displayName = "Meteora";
  readonly chainId = "solana";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const connection = getSolanaConnection();
    const wallet = new PublicKey(address);

    // Fetch V1 and V2 positions in parallel.
    // Both use memcmp on owner at offset 40.
    const ownerFilter = {
      memcmp: {
        offset: 40,
        bytes: wallet.toBase58(),
      },
    };

    const [v1Accounts, v2Accounts] = await Promise.all([
      connection.getProgramAccounts(METEORA_DLMM_PROGRAM, {
        filters: [{ dataSize: POSITION_V1_SIZE }, ownerFilter],
      }).catch((err) => {
        console.warn("[meteora] V1 getProgramAccounts failed:", err instanceof Error ? err.message : err);
        return [];
      }),
      connection.getProgramAccounts(METEORA_DLMM_PROGRAM, {
        filters: [{ dataSize: POSITION_V2_SIZE }, ownerFilter],
      }).catch((err) => {
        console.warn("[meteora] V2 getProgramAccounts failed:", err instanceof Error ? err.message : err);
        return [];
      }),
    ]);

    console.log(
      `[meteora] Found ${v1Accounts.length} V1 + ${v2Accounts.length} V2 positions for ${address}`
    );

    // Parse all position accounts
    const parsed: ParsedPosition[] = [];

    for (const { pubkey, account } of v1Accounts) {
      const p = parsePositionV1(pubkey.toBase58(), account.data as Buffer);
      if (p) parsed.push(p);
    }
    for (const { pubkey, account } of v2Accounts) {
      const p = parsePositionV2(pubkey.toBase58(), account.data as Buffer);
      if (p) parsed.push(p);
    }

    if (parsed.length === 0) {
      if (v1Accounts.length === 0 && v2Accounts.length === 0) {
        console.log("[meteora] No positions found. If you expect positions, set SOLANA_RPC_URL to a provider that supports getProgramAccounts (e.g. Helius, QuickNode).");
      }
      return [];
    }

    // Fetch pair metadata for all unique pairs
    const uniquePairs = [...new Set(parsed.map((p) => p.lbPair))];
    await Promise.all(uniquePairs.map((pair) => getPairMeta(pair)));

    // Build LP position data
    const positions: LPPositionData[] = [];

    for (const pos of parsed) {
      try {
        const pair = pairCache.get(pos.lbPair);

        let tokenXAddr: string;
        let tokenYAddr: string;
        let decX: number;
        let decY: number;
        let activeBinId: number;

        if (pair) {
          tokenXAddr = pair.mint_x;
          tokenYAddr = pair.mint_y;
          decX = pair.decimals_x;
          decY = pair.decimals_y;
          activeBinId = pair.active_bin_id;
        } else {
          // Fallback: read pair account on-chain
          const pairAccount = await connection.getAccountInfo(new PublicKey(pos.lbPair));
          if (!pairAccount) continue;
          const pairData = pairAccount.data;
          tokenXAddr = new PublicKey(pairData.subarray(72, 104)).toBase58();
          tokenYAddr = new PublicKey(pairData.subarray(104, 136)).toBase58();
          activeBinId = pairData.readInt32LE(136);

          const metaX = await resolveTokenMeta(tokenXAddr);
          const metaY = await resolveTokenMeta(tokenYAddr);
          decX = metaX?.decimals ?? 9;
          decY = metaY?.decimals ?? 9;
        }

        // Skip positions with zero liquidity
        if (pos.totalLiquidityX === 0n && pos.totalLiquidityY === 0n) continue;

        // For DLMM, liquidity shares represent the user's share of each bin.
        // The actual token amounts depend on bin prices and reserves.
        // As a rough estimate, we use the total shares as token amounts.
        const token0Amount = Number(pos.totalLiquidityX) / 10 ** decX;
        const token1Amount = Number(pos.totalLiquidityY) / 10 ** decY;

        const [sym0, sym1] = await Promise.all([
          resolveSymbol(tokenXAddr),
          resolveSymbol(tokenYAddr),
        ]);

        positions.push({
          nftTokenId: pos.pubkey,
          protocol: "meteora",
          poolAddress: pos.lbPair,
          token0Address: tokenXAddr,
          token0Symbol: sym0,
          token0Decimals: decX,
          token1Address: tokenYAddr,
          token1Symbol: sym1,
          token1Decimals: decY,
          liquidity: pos.totalLiquidityX + pos.totalLiquidityY,
          tickLower: pos.lowerBinId,
          tickUpper: pos.upperBinId,
          currentTick: activeBinId,
          token0Amount,
          token1Amount,
        });
      } catch (err) {
        console.warn(
          `[meteora] Failed to enrich position ${pos.pubkey}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.log(`[meteora] Returning ${positions.length} active DLMM positions`);
    return positions;
  }
}

export const meteoraAdapter = new MeteoraAdapter();
