// Meteora DLMM adapter (Solana)
// Meteora uses Dynamic Liquidity Market Making (DLMM) — bin-based liquidity
// similar to Trader Joe's Liquidity Book, but on Solana.
//
// Requires: @solana/web3.js
// Meteora DLMM program: LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Meteora DLMM program ID
const METEORA_DLMM_PROGRAM = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
);

// SPL Token program
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// Known token metadata cache (populated on-demand)
const tokenMetaCache = new Map<string, { symbol: string; decimals: number }>();

async function getTokenMeta(
  connection: Connection,
  mint: string
): Promise<{ symbol: string; decimals: number }> {
  const cached = tokenMetaCache.get(mint);
  if (cached) return cached;

  try {
    // Fetch mint info for decimals
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (mintInfo.value?.data && "parsed" in mintInfo.value.data) {
      const parsed = mintInfo.value.data.parsed;
      const decimals = parsed.info?.decimals ?? 9;
      const meta = { symbol: mint.slice(0, 4) + "...", decimals };
      tokenMetaCache.set(mint, meta);
      return meta;
    }
  } catch {
    // fallback
  }

  const fallback = { symbol: mint.slice(0, 4) + "...", decimals: 9 };
  tokenMetaCache.set(mint, fallback);
  return fallback;
}

// Known Solana token symbols
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

export class MeteoraAdapter implements DefiProtocolAdapter {
  readonly protocolName = "meteora";
  readonly protocolId = "meteora-solana";
  readonly slug = "meteora";
  readonly displayName = "Meteora";
  readonly chainId = "solana";
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const wallet = new PublicKey(address);

    // Find all Meteora DLMM position accounts owned by this wallet.
    // DLMM positions are PDAs with the user as authority.
    // We use getProgramAccounts with a memcmp filter on the owner field.
    //
    // Meteora DLMM Position account layout (simplified):
    // offset 8: lb_pair (32 bytes) — the pool
    // offset 40: owner (32 bytes) — position owner

    const positionAccounts = await this.connection.getProgramAccounts(
      METEORA_DLMM_PROGRAM,
      {
        filters: [
          { dataSize: 8120 }, // DLMM Position account size
          {
            memcmp: {
              offset: 40,
              bytes: wallet.toBase58(),
            },
          },
        ],
      }
    );

    console.log(
      `[meteora] Found ${positionAccounts.length} DLMM positions for ${address}`
    );

    if (positionAccounts.length === 0) return [];

    const positions: LPPositionData[] = [];

    for (const { pubkey, account } of positionAccounts) {
      try {
        const data = account.data;

        // Parse LB pair address (pool) from position data
        const lbPairBytes = data.subarray(8, 40);
        const lbPair = new PublicKey(lbPairBytes);

        // Fetch LB pair account to get token mints
        const lbPairAccount = await this.connection.getAccountInfo(lbPair);
        if (!lbPairAccount) continue;

        const pairData = lbPairAccount.data;
        // LB pair layout (simplified):
        // offset 8+32+32 = 72: token_x_mint (32 bytes)
        // offset 104: token_y_mint (32 bytes)
        // offset 136: active_id (i32, 4 bytes)
        const tokenXMint = new PublicKey(pairData.subarray(72, 104));
        const tokenYMint = new PublicKey(pairData.subarray(104, 136));
        const activeId = pairData.readInt32LE(136);

        const tokenXAddr = tokenXMint.toBase58();
        const tokenYAddr = tokenYMint.toBase58();

        const metaX = await getTokenMeta(this.connection, tokenXAddr);
        const metaY = await getTokenMeta(this.connection, tokenYAddr);

        // Override symbol if known
        if (KNOWN_SYMBOLS[tokenXAddr]) metaX.symbol = KNOWN_SYMBOLS[tokenXAddr];
        if (KNOWN_SYMBOLS[tokenYAddr]) metaY.symbol = KNOWN_SYMBOLS[tokenYAddr];

        // Parse position bins to estimate token amounts.
        // Each bin entry: bin_id (i32) + amount_x (u64) + amount_y (u64) = 20 bytes
        // The bin array starts at offset 72 in the position account.
        const BIN_ENTRY_SIZE = 20;
        const BIN_ARRAY_OFFSET = 72;
        const numBins = Math.floor(
          (data.length - BIN_ARRAY_OFFSET) / BIN_ENTRY_SIZE
        );

        let totalAmountX = 0n;
        let totalAmountY = 0n;

        for (let i = 0; i < numBins; i++) {
          const offset = BIN_ARRAY_OFFSET + i * BIN_ENTRY_SIZE;
          if (offset + BIN_ENTRY_SIZE > data.length) break;

          const amountX = data.readBigUInt64LE(offset + 4);
          const amountY = data.readBigUInt64LE(offset + 12);
          totalAmountX += amountX;
          totalAmountY += amountY;
        }

        // If no liquidity detected, skip
        if (totalAmountX === 0n && totalAmountY === 0n) continue;

        positions.push({
          nftTokenId: pubkey.toBase58(),
          protocol: "meteora",
          poolAddress: lbPair.toBase58(),
          token0Address: tokenXAddr,
          token0Symbol: metaX.symbol,
          token0Decimals: metaX.decimals,
          token1Address: tokenYAddr,
          token1Symbol: metaY.symbol,
          token1Decimals: metaY.decimals,
          liquidity: totalAmountX + totalAmountY, // approximate
          tickLower: activeId - 100,  // approximate bin range
          tickUpper: activeId + 100,
          token0Amount:
            Number(totalAmountX) / 10 ** metaX.decimals,
          token1Amount:
            Number(totalAmountY) / 10 ** metaY.decimals,
        });
      } catch (err) {
        console.warn(
          `[meteora] Failed to parse position ${pubkey.toBase58()}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    return positions;
  }
}

export const meteoraAdapter = new MeteoraAdapter();
