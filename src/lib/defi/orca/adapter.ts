// Orca Whirlpool adapter (Solana)
// Orca uses "Whirlpools" — concentrated liquidity on Solana.
//
// Requires: @solana/web3.js
// Whirlpool program: whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Orca Whirlpool program ID
const WHIRLPOOL_PROGRAM = new PublicKey(
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"
);

// Known Solana token symbols
const KNOWN_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "JUP",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "mSOL",
  orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE: "ORCA",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
};

// Token metadata cache
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

export class OrcaWhirlpoolAdapter implements DefiProtocolAdapter {
  readonly protocolName = "orca";
  readonly protocolId = "orca-solana";
  readonly slug = "orca";
  readonly displayName = "Orca";
  readonly chainId = "solana";
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const wallet = new PublicKey(address);

    // Orca Whirlpool Position account layout:
    // - discriminator: 8 bytes
    // - whirlpool: 32 bytes (offset 8)
    // - position_mint: 32 bytes (offset 40)
    // - liquidity: u128 (offset 72, 16 bytes)
    // - tick_lower_index: i32 (offset 88, 4 bytes)
    // - tick_upper_index: i32 (offset 92, 4 bytes)
    // - fee_owed_a: u64 (offset 128, 8 bytes)
    // - fee_owed_b: u64 (offset 136, 8 bytes)
    //
    // Position size: 216 bytes

    // Find position accounts where the position_mint is a token the user owns.
    // First, get all token accounts the user holds (these include position NFTs).
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      wallet,
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    // Filter to NFT-like accounts (amount = 1, decimals = 0)
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

    // For each NFT mint, derive the Whirlpool position PDA
    // PDA: ["position", position_mint]
    const positionPDAs: { pda: PublicKey; mint: string }[] = [];
    for (const mint of nftMints) {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), new PublicKey(mint).toBuffer()],
        WHIRLPOOL_PROGRAM
      );
      positionPDAs.push({ pda, mint });
    }

    // Batch-fetch all position accounts
    const positionPubkeys = positionPDAs.map((p) => p.pda);
    const positionInfos =
      await this.connection.getMultipleAccountsInfo(positionPubkeys);

    console.log(
      `[orca] Checking ${positionPDAs.length} potential Whirlpool positions for ${address}`
    );

    const positions: LPPositionData[] = [];

    for (let i = 0; i < positionInfos.length; i++) {
      const info = positionInfos[i];
      if (!info || !info.owner.equals(WHIRLPOOL_PROGRAM)) continue;

      try {
        const data = info.data;
        if (data.length < 144) continue;

        // Parse position data
        const whirlpoolAddr = new PublicKey(data.subarray(8, 40));
        // liquidity: u128 at offset 72
        const liquidityLow = data.readBigUInt64LE(72);
        const liquidityHigh = data.readBigUInt64LE(80);
        const liquidity = liquidityHigh * (1n << 64n) + liquidityLow;

        const tickLower = data.readInt32LE(88);
        const tickUpper = data.readInt32LE(92);

        if (liquidity === 0n) continue;

        // Parse fee owed
        const feeOwedA = data.readBigUInt64LE(128);
        const feeOwedB = data.readBigUInt64LE(136);

        // Fetch whirlpool account for token mints + current tick
        const whirlpoolInfo = await this.connection.getAccountInfo(whirlpoolAddr);
        if (!whirlpoolInfo) continue;

        const wpData = whirlpoolInfo.data;
        // Whirlpool layout:
        // offset 8: whirlpools_config (32)
        // offset 40: whirlpool_bump (1)
        // offset 41: tick_spacing (2)
        // offset 43: tick_spacing_seed (2)
        // offset 45: fee_rate (2)
        // offset 47: protocol_fee_rate (2)
        // offset 49: liquidity (u128, 16)
        // offset 65: sqrt_price (u128, 16)
        // offset 81: tick_current_index (i32, 4)
        // ...
        // offset 101: token_mint_a (32)
        // offset 133: token_mint_b (32)

        const currentTick = wpData.readInt32LE(81);
        const tokenMintA = new PublicKey(wpData.subarray(101, 133));
        const tokenMintB = new PublicKey(wpData.subarray(133, 165));

        const addrA = tokenMintA.toBase58();
        const addrB = tokenMintB.toBase58();

        const metaA = await getTokenMeta(this.connection, addrA);
        const metaB = await getTokenMeta(this.connection, addrB);

        // Compute approximate token amounts using CL math
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

        amount0 = amount0 / 10 ** metaA.decimals;
        amount1 = amount1 / 10 ** metaB.decimals;

        const fees0 = Number(feeOwedA) / 10 ** metaA.decimals;
        const fees1 = Number(feeOwedB) / 10 ** metaB.decimals;

        positions.push({
          nftTokenId: positionPDAs[i].mint,
          protocol: "orca",
          poolAddress: whirlpoolAddr.toBase58(),
          token0Address: addrA,
          token0Symbol: metaA.symbol,
          token0Decimals: metaA.decimals,
          token1Address: addrB,
          token1Symbol: metaB.symbol,
          token1Decimals: metaB.decimals,
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
          `[orca] Failed to parse position:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.log(`[orca] Found ${positions.length} active Whirlpool positions`);
    return positions;
  }
}

export const orcaAdapter = new OrcaWhirlpoolAdapter();
