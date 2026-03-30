// Orca Whirlpool adapter (Solana)
// Orca uses "Whirlpools" — concentrated liquidity on Solana.
//
// Requires: @solana/web3.js
// Whirlpool program: whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getTokenAccountsForWallet, getSolanaConnection } from "@/lib/chain/solana/token-accounts";
import { resolveTokenMeta } from "@/lib/chain/solana/token-list";

// Orca Whirlpool program ID
const WHIRLPOOL_PROGRAM = new PublicKey(
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"
);

// Known Solana token symbols (fast path)
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

async function resolveSymbol(mint: string): Promise<{ symbol: string; decimals: number }> {
  // Try Jupiter token list first (covers most tokens, like Phantom does)
  const meta = await resolveTokenMeta(mint);
  if (meta) return { symbol: meta.symbol, decimals: meta.decimals };
  // Fallback to known symbols
  const symbol = KNOWN_SYMBOLS[mint] ?? mint.slice(0, 4) + "...";
  return { symbol, decimals: 9 };
}

export class OrcaWhirlpoolAdapter implements DefiProtocolAdapter {
  readonly protocolName = "orca";
  readonly protocolId = "orca-solana";
  readonly slug = "orca";
  readonly displayName = "Orca";
  readonly chainId = "solana";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const connection = getSolanaConnection();

    // Use shared token accounts cache (no extra RPC call)
    const { nftMints } = await getTokenAccountsForWallet(address);

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
      await connection.getMultipleAccountsInfo(positionPubkeys);

    console.log(
      `[orca] Checking ${positionPDAs.length} potential Whirlpool positions for ${address}`
    );

    const validCount = positionInfos.filter(
      (info) => info && info.owner.equals(WHIRLPOOL_PROGRAM)
    ).length;
    console.log(
      `[orca] PDA resolution: ${validCount}/${positionPDAs.length} resolved to valid Whirlpool positions`
    );

    const positions: LPPositionData[] = [];

    for (let i = 0; i < positionInfos.length; i++) {
      const info = positionInfos[i];
      if (!info || !info.owner.equals(WHIRLPOOL_PROGRAM)) continue;

      try {
        const data = Buffer.isBuffer(info.data) ? info.data : Buffer.from(info.data);
        if (data.length < 144) continue;

        // Position layout (from Orca Whirlpool IDL):
        // 0-7:     discriminator (8 bytes)
        // 8-39:    whirlpool (Pubkey, 32 bytes)
        // 40-71:   position_mint (Pubkey, 32 bytes)
        // 72-87:   liquidity (u128, 16 bytes)
        // 88-91:   tick_lower_index (i32, 4 bytes)
        // 92-95:   tick_upper_index (i32, 4 bytes)
        // 96-111:  fee_growth_checkpoint_a (u128, 16 bytes)
        // 112-119: fee_owed_a (u64, 8 bytes)
        // 120-135: fee_growth_checkpoint_b (u128, 16 bytes)
        // 136-143: fee_owed_b (u64, 8 bytes)
        // 144-215: reward_infos (PositionRewardInfo[3], 72 bytes)

        const whirlpoolAddr = new PublicKey(data.subarray(8, 40));

        // liquidity: u128 at offset 72
        const liquidityLow = data.readBigUInt64LE(72);
        const liquidityHigh = data.readBigUInt64LE(80);
        const liquidity = (liquidityHigh << 64n) | liquidityLow;

        const tickLower = data.readInt32LE(88);
        const tickUpper = data.readInt32LE(92);

        if (liquidity === 0n) continue;

        // Parse fees owed
        const feeOwedA = data.readBigUInt64LE(112);
        const feeOwedB = data.readBigUInt64LE(136);

        // Fetch whirlpool account for token mints + current tick
        const whirlpoolInfo = await connection.getAccountInfo(whirlpoolAddr);
        if (!whirlpoolInfo) continue;

        const wpData = Buffer.isBuffer(whirlpoolInfo.data) ? whirlpoolInfo.data : Buffer.from(whirlpoolInfo.data);

        // Whirlpool layout (from Orca Whirlpool IDL):
        // 0-7:     discriminator (8 bytes)
        // 8-39:    whirlpools_config (Pubkey, 32 bytes)
        // 40:      whirlpool_bump (u8, 1 byte)
        // 41-42:   tick_spacing (u16, 2 bytes)
        // 43-44:   fee_tier_index_seed (u8[2], 2 bytes)
        // 45-46:   fee_rate (u16, 2 bytes)
        // 47-48:   protocol_fee_rate (u16, 2 bytes)
        // 49-64:   liquidity (u128, 16 bytes)
        // 65-80:   sqrt_price (u128, 16 bytes)
        // 81-84:   tick_current_index (i32, 4 bytes)
        // 85-92:   protocol_fee_owed_a (u64, 8 bytes)
        // 93-100:  protocol_fee_owed_b (u64, 8 bytes)
        // 101-132: token_mint_a (Pubkey, 32 bytes)
        // 133-164: token_vault_a (Pubkey, 32 bytes)
        // 165-180: fee_growth_global_a (u128, 16 bytes)
        // 181-212: token_mint_b (Pubkey, 32 bytes)
        // 213-244: token_vault_b (Pubkey, 32 bytes)
        // 245-260: fee_growth_global_b (u128, 16 bytes)

        const currentTick = wpData.readInt32LE(81);
        const tokenMintA = new PublicKey(wpData.subarray(101, 133));
        const tokenMintB = new PublicKey(wpData.subarray(181, 213));

        const addrA = tokenMintA.toBase58();
        const addrB = tokenMintB.toBase58();

        const metaA = await resolveSymbol(addrA);
        const metaB = await resolveSymbol(addrB);

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
          currentTick,
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
