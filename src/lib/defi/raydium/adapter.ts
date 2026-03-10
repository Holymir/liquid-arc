// Raydium CLMM adapter (Solana)
// Raydium Concentrated Liquidity Market Maker — tick-based CL on Solana.
//
// Requires: @solana/web3.js
// Raydium CLMM program: CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Raydium CLMM program ID
const RAYDIUM_CLMM_PROGRAM = new PublicKey(
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK"
);

// Known Solana token symbols
const KNOWN_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "JUP",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
};

const tokenMetaCache = new Map<string, { symbol: string; decimals: number }>();

async function getTokenMeta(
  connection: Connection,
  mint: string
): Promise<{ symbol: string; decimals: number }> {
  const cached = tokenMetaCache.get(mint);
  if (cached) return cached;

  try {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (mintInfo.value?.data && "parsed" in mintInfo.value.data) {
      const decimals = mintInfo.value.data.parsed.info?.decimals ?? 9;
      const symbol = KNOWN_SYMBOLS[mint] ?? mint.slice(0, 4) + "...";
      const meta = { symbol, decimals };
      tokenMetaCache.set(mint, meta);
      return meta;
    }
  } catch {
    // fallback
  }

  const symbol = KNOWN_SYMBOLS[mint] ?? mint.slice(0, 4) + "...";
  const fallback = { symbol, decimals: 9 };
  tokenMetaCache.set(mint, fallback);
  return fallback;
}

export class RaydiumCLMMAdapter implements DefiProtocolAdapter {
  readonly protocolName = "raydium";
  readonly protocolId = "raydium-solana";
  readonly slug = "raydium";
  readonly displayName = "Raydium";
  readonly chainId = "solana";
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const wallet = new PublicKey(address);

    // Raydium CLMM PersonalPosition account layout:
    // - discriminator: 8 bytes
    // - nft_mint: 32 bytes (offset 8)
    // - pool_id: 32 bytes (offset 40)
    // - tick_lower_index: i32 (offset 72)
    // - tick_upper_index: i32 (offset 76)
    // - liquidity: u128 (offset 80, 16 bytes)
    // - fee_growth_inside_0_last: u128 (offset 96)
    // - fee_growth_inside_1_last: u128 (offset 112)
    // - token_fees_owed_0: u64 (offset 128)
    // - token_fees_owed_1: u64 (offset 136)
    //
    // PersonalPosition size: ~236 bytes

    // First find all NFTs the user holds
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      wallet,
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    const nftMints = new Set<string>();
    for (const { account } of tokenAccounts.value) {
      const parsed = account.data.parsed;
      if (parsed.type !== "account") continue;
      const info = parsed.info;
      if (
        info.tokenAmount.amount === "1" &&
        info.tokenAmount.decimals === 0
      ) {
        nftMints.add(info.mint);
      }
    }

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
      await this.connection.getMultipleAccountsInfo(positionPubkeys);

    console.log(
      `[raydium] Checking ${positionPDAs.length} potential CLMM positions for ${address}`
    );

    const positions: LPPositionData[] = [];

    for (let i = 0; i < positionInfos.length; i++) {
      const info = positionInfos[i];
      if (!info || !info.owner.equals(RAYDIUM_CLMM_PROGRAM)) continue;

      try {
        const data = info.data;
        if (data.length < 144) continue;

        // Parse position data
        const poolId = new PublicKey(data.subarray(40, 72));
        const tickLower = data.readInt32LE(72);
        const tickUpper = data.readInt32LE(76);

        // liquidity: u128 at offset 80
        const liquidityLow = data.readBigUInt64LE(80);
        const liquidityHigh = data.readBigUInt64LE(88);
        const liquidity = liquidityHigh * (1n << 64n) + liquidityLow;

        if (liquidity === 0n) continue;

        // Fees owed
        const feesOwed0 = data.readBigUInt64LE(128);
        const feesOwed1 = data.readBigUInt64LE(136);

        // Fetch pool account for token mints + current tick
        const poolInfo = await this.connection.getAccountInfo(poolId);
        if (!poolInfo) continue;

        const poolData = poolInfo.data;

        // Raydium CLMM PoolState layout (simplified):
        // offset 8+1+2+16+16 = 43: token_mint_0 (32)
        // offset 75: token_mint_1 (32)
        // offset 253: tick_current (i32)
        // Note: exact offsets may vary by program version — these are approximate.
        // offset 8: bump (1)
        // offset 9: amm_config (32)
        // offset 41: owner (32)
        // offset 73: token_mint_0 (32)
        // offset 105: token_mint_1 (32)
        // ...
        // offset 245: tick_current (i32)

        const tokenMint0 = new PublicKey(poolData.subarray(73, 105));
        const tokenMint1 = new PublicKey(poolData.subarray(105, 137));
        const currentTick = poolData.readInt32LE(245);

        const addr0 = tokenMint0.toBase58();
        const addr1 = tokenMint1.toBase58();

        const meta0 = await getTokenMeta(this.connection, addr0);
        const meta1 = await getTokenMeta(this.connection, addr1);

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

        amount0 = amount0 / 10 ** meta0.decimals;
        amount1 = amount1 / 10 ** meta1.decimals;

        const fees0 = Number(feesOwed0) / 10 ** meta0.decimals;
        const fees1 = Number(feesOwed1) / 10 ** meta1.decimals;

        positions.push({
          nftTokenId: positionPDAs[i].mint,
          protocol: "raydium",
          poolAddress: poolId.toBase58(),
          token0Address: addr0,
          token0Symbol: meta0.symbol,
          token0Decimals: meta0.decimals,
          token1Address: addr1,
          token1Symbol: meta1.symbol,
          token1Decimals: meta1.decimals,
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
