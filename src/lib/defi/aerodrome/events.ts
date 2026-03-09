// Aerodrome CL position entry data
//
// Primary: The Graph subgraph (instant, reliable)
// Fallback: On-chain event scanning via public RPC (slow, may fail)

import { baseClient } from "@/lib/chain/base/client";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "./abi";
import { getPositionEntryFromSubgraph } from "./subgraph";
import { parseAbiItem, formatUnits } from "viem";

const INCREASE_LIQUIDITY_EVENT = parseAbiItem(
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
);

// Public RPC limits getLogs to 10k blocks per call
const CHUNK_SIZE = 9_900n;

// Search windows: try recent blocks first, then expand backward.
// Base produces ~2 blocks/sec = ~172,800 blocks/day
const BLOCKS_PER_DAY = 172_800n;

export interface PositionEntryData {
  nftTokenId: string;
  blockNumber: bigint;
  timestamp: number;       // unix seconds
  amount0Raw: bigint;
  amount1Raw: bigint;
  amount0: number;         // formatted with decimals
  amount1: number;
  liquidity: bigint;
}

/**
 * Fetch the initial mint data for a CL position NFT.
 *
 * Strategy:
 * 1. Try The Graph subgraph (instant, reliable — requires GRAPH_API_KEY)
 * 2. Fall back to on-chain event scanning via public RPC
 */
export async function getPositionEntry(
  nftTokenId: string,
  token0Decimals: number,
  token1Decimals: number
): Promise<PositionEntryData | null> {
  // 1. Try subgraph first
  const subgraphResult = await getPositionEntryFromSubgraph(
    nftTokenId,
    token0Decimals,
    token1Decimals
  );
  if (subgraphResult) return subgraphResult;

  // 2. Fallback: scan on-chain events
  try {
    const currentBlock = await baseClient.getBlockNumber();
    const tokenIdBig = BigInt(nftTokenId);

    const windowDays = [7n, 30n, 90n];

    for (const days of windowDays) {
      const windowBlocks = days * BLOCKS_PER_DAY;
      const fromBlock = currentBlock > windowBlocks
        ? currentBlock - windowBlocks
        : 1n;

      const result = await scanRange(
        tokenIdBig,
        fromBlock,
        currentBlock,
        token0Decimals,
        token1Decimals,
        nftTokenId
      );

      if (result) return result;
    }

    return null;
  } catch (err) {
    console.warn(
      `[aerodrome] Failed to fetch entry events for NFT #${nftTokenId}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Scan a block range in chunks for the IncreaseLiquidity event.
 * Retries each chunk up to 3 times on transient RPC errors (503, rate limits).
 * Returns the first match or null.
 */
async function scanRange(
  tokenId: bigint,
  fromBlock: bigint,
  toBlock: bigint,
  token0Decimals: number,
  token1Decimals: number,
  nftTokenId: string
): Promise<PositionEntryData | null> {
  for (let from = fromBlock; from <= toBlock; from += CHUNK_SIZE + 1n) {
    const to = from + CHUNK_SIZE > toBlock ? toBlock : from + CHUNK_SIZE;

    let logs;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        logs = await baseClient.getLogs({
          address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
          event: INCREASE_LIQUIDITY_EVENT,
          args: { tokenId },
          fromBlock: from,
          toBlock: to,
        });
        break; // success
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < 2 && (msg.includes("503") || msg.includes("429") || msg.includes("healthy"))) {
          // Wait 1-2s then retry
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw err; // non-retryable or exhausted retries
      }
    }

    if (logs && logs.length > 0) {
      const mint = logs[0];
      const block = await baseClient.getBlock({ blockNumber: mint.blockNumber! });

      console.log(
        `[aerodrome] Found on-chain entry for NFT #${nftTokenId} at block ${mint.blockNumber}`
      );

      return {
        nftTokenId,
        blockNumber: mint.blockNumber!,
        timestamp: Number(block.timestamp),
        amount0Raw: mint.args.amount0!,
        amount1Raw: mint.args.amount1!,
        amount0: parseFloat(formatUnits(mint.args.amount0!, token0Decimals)),
        amount1: parseFloat(formatUnits(mint.args.amount1!, token1Decimals)),
        liquidity: mint.args.liquidity!,
      };
    }
  }

  return null;
}
