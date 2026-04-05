/**
 * LP event ingestion for a wallet.
 *
 * Fetches EVM asset transfers from Alchemy, classifies them as LP events,
 * computes USD value at event time (from stored position snapshots), and
 * upserts rows into wallet_events.
 *
 * Classification heuristic:
 *   - ERC-721 transfer TO wallet   → add_liquidity (received LP NFT)
 *   - ERC-721 transfer FROM wallet → remove_liquidity (burned LP NFT)
 *   - ERC-20  transfer TO wallet   → collect_fees (received fee tokens)
 *   - ERC-20  transfer FROM wallet → token_transfer (generic send)
 *
 * P&L is computed for remove_liquidity events by comparing valueUsd to
 * the cost basis from the entry PositionSnapshot.
 */

import { prisma } from "@/lib/db/prisma";
import { getAssetTransfers } from "@/lib/chain/alchemy/client";

// Known LP NFT contract addresses (position managers)
const LP_NFT_CONTRACTS = new Set([
  // Uniswap v3 NonfungiblePositionManager (all chains)
  "0xc36442b4a4522e871399cd717abdd847ab11fe88",
  // Aerodrome / Velodrome gauge contracts — add as discovered
]);

function hexToDecimal(hex: string): bigint {
  try {
    return BigInt(hex);
  } catch {
    return BigInt(0);
  }
}

/**
 * Ingest LP events for a wallet on a given chain.
 * Returns number of new events upserted.
 */
export async function ingestWalletEvents(
  walletId: string,
  walletAddress: string,
  chainId: string
): Promise<{ upserted: number; errors: number }> {
  // Find the most recent event we have to avoid re-fetching everything
  const latest = await prisma.walletEvent.findFirst({
    where: { walletId, chainId },
    orderBy: { blockNumber: "desc" },
    select: { blockNumber: true },
  });

  const fromBlock = latest
    ? "0x" + (latest.blockNumber + BigInt(1)).toString(16)
    : "0x0";

  const transfers = await getAssetTransfers(chainId, walletAddress, {
    fromBlock,
    category: ["erc20", "erc721", "erc1155"],
    maxPages: 3,
  });

  if (transfers.length === 0) return { upserted: 0, errors: 0 };

  // Also fetch outbound transfers (FROM the wallet) for remove_liquidity
  const outboundTransfers = await getAssetTransfers(chainId, walletAddress, {
    fromBlock,
    category: ["erc721"],
    maxPages: 2,
  });

  // Combine and deduplicate by txHash
  const all = [...transfers, ...outboundTransfers].filter(
    (t, i, arr) => arr.findIndex((x) => x.hash === t.hash && x.erc721TokenId === t.erc721TokenId) === i
  );

  // Load known pool addresses for context
  const pools = await prisma.pool.findMany({
    where: { chainId },
    select: { poolAddress: true, token0Symbol: true, token1Symbol: true },
  });
  const poolSet = new Set(pools.map((p) => p.poolAddress.toLowerCase()));

  let upserted = 0;
  let errors = 0;

  for (const tx of all) {
    try {
      const contractAddress = tx.rawContract.address?.toLowerCase() ?? "";
      const isToWallet = tx.to?.toLowerCase() === walletAddress.toLowerCase();
      const isNft = tx.category === "erc721" || tx.category === "erc1155";
      const isLpNft = isNft && LP_NFT_CONTRACTS.has(contractAddress);
      const isPool = poolSet.has(contractAddress);

      let eventType: string;
      if (isLpNft) {
        eventType = isToWallet ? "add_liquidity" : "remove_liquidity";
      } else if (isPool && !isNft && isToWallet) {
        eventType = "collect_fees";
      } else {
        eventType = "token_transfer";
      }

      const blockNum = hexToDecimal(tx.blockNum);
      const eventAt = tx.metadata.blockTimestamp
        ? new Date(tx.metadata.blockTimestamp)
        : new Date();

      const nftTokenId = tx.erc721TokenId
        ? BigInt(tx.erc721TokenId).toString()
        : null;

      // Look up position snapshot near this event time for P&L context
      let costBasisUsd: number | null = null;
      let pnlUsd: number | null = null;
      let pnlPct: number | null = null;

      if (eventType === "remove_liquidity" && nftTokenId) {
        // Find entry snapshot for this position
        const entry = await prisma.positionSnapshot.findFirst({
          where: { walletId, nftTokenId, isEntry: true },
          select: { positionUsd: true },
        });
        // Find closest snapshot to this event for current value
        const snap = await prisma.positionSnapshot.findFirst({
          where: {
            walletId,
            nftTokenId,
            snapshotAt: { lte: new Date(eventAt.getTime() + 86400000) },
          },
          orderBy: { snapshotAt: "desc" },
          select: { positionUsd: true },
        });

        if (entry && snap && entry.positionUsd > 0) {
          costBasisUsd = entry.positionUsd;
          pnlUsd = snap.positionUsd - entry.positionUsd;
          pnlPct = (pnlUsd / entry.positionUsd) * 100;
        }
      }

      await prisma.walletEvent.upsert({
        where: {
          walletId_chainId_txHash_eventType: {
            walletId,
            chainId,
            txHash: tx.hash,
            eventType,
          },
        },
        create: {
          walletId,
          chainId,
          txHash: tx.hash,
          blockNumber: blockNum,
          eventAt,
          eventType,
          nftTokenId,
          poolAddress: isPool ? contractAddress : null,
          token0Address: contractAddress || null,
          token0Symbol: tx.asset,
          token0Amount: tx.value,
          valueUsd: null, // priced separately
          costBasisUsd,
          pnlUsd,
          pnlPct,
          rawData: tx as unknown as Parameters<typeof prisma.walletEvent.create>[0]["data"]["rawData"],
        },
        update: {
          // Update P&L if it's now computable
          ...(pnlUsd !== null ? { pnlUsd, pnlPct, costBasisUsd } : {}),
        },
      });

      upserted++;
    } catch (err) {
      console.error(`[events] Failed to upsert tx ${tx.hash}:`, err);
      errors++;
    }
  }

  return { upserted, errors };
}
