// Raydium CLMM adapter (Solana)
// Raydium Concentrated Liquidity Market Maker — tick-based CL on Solana.
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

async function resolveSymbol(mint: string): Promise<{ symbol: string; decimals: number }> {
  if (KNOWN_SYMBOLS[mint]) {
    // Still need decimals from on-chain
    const meta = await resolveTokenMeta(mint);
    return { symbol: KNOWN_SYMBOLS[mint], decimals: meta?.decimals ?? 9 };
  }
  const meta = await resolveTokenMeta(mint);
  if (meta) return { symbol: meta.symbol, decimals: meta.decimals };
  return { symbol: mint.slice(0, 4) + "...", decimals: 9 };
}

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
        const data = info.data;
        if (data.length < 145) continue;

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

        const poolId = new PublicKey(data.subarray(41, 73));
        const tickLower = data.readInt32LE(73);
        const tickUpper = data.readInt32LE(77);

        // liquidity: u128 at offset 81
        const liquidityLow = data.readBigUInt64LE(81);
        const liquidityHigh = data.readBigUInt64LE(89);
        const liquidity = (liquidityHigh << 64n) | liquidityLow;

        if (liquidity === 0n) continue;

        // Fees owed
        const feesOwed0 = data.readBigUInt64LE(129);
        const feesOwed1 = data.readBigUInt64LE(137);

        // Fetch pool account for token mints + current tick
        const poolInfo = await connection.getAccountInfo(poolId);
        if (!poolInfo) continue;

        const poolData = poolInfo.data;

        // PoolState layout (from Raydium CLMM IDL, #[repr(C, packed)]):
        // 0-7:     discriminator (8 bytes)
        // 8:       bump (1 byte)
        // 9-40:    amm_config (32 bytes)
        // 41-72:   owner (32 bytes)
        // 73-104:  token_mint_0 (32 bytes)
        // 105-136: token_mint_1 (32 bytes)
        // 137-168: token_vault_0 (32 bytes)
        // 169-200: token_vault_1 (32 bytes)
        // 201-232: observation_key (32 bytes)
        // 233:     mint_decimals_0 (u8)
        // 234:     mint_decimals_1 (u8)
        // 235-236: tick_spacing (u16)
        // 237-252: liquidity (u128)
        // 253-268: sqrt_price_x64 (u128)
        // 269-272: tick_current (i32)

        const tokenMint0 = new PublicKey(poolData.subarray(73, 105));
        const tokenMint1 = new PublicKey(poolData.subarray(105, 137));
        const mintDecimals0 = poolData.readUInt8(233);
        const mintDecimals1 = poolData.readUInt8(234);
        const currentTick = poolData.readInt32LE(269);

        const addr0 = tokenMint0.toBase58();
        const addr1 = tokenMint1.toBase58();

        const meta0 = await resolveSymbol(addr0);
        const meta1 = await resolveSymbol(addr1);

        // Use decimals from the pool account (authoritative)
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

        const fees0 = Number(feesOwed0) / 10 ** dec0;
        const fees1 = Number(feesOwed1) / 10 ** dec1;

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
          token0Amount: amount0,
          token1Amount: amount1,
          fees0Amount: fees0,
          fees1Amount: fees1,
        });
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
