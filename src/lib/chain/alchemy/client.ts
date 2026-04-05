/**
 * Alchemy Asset Transfers API client.
 *
 * Used for fetching EVM LP transaction history (add/remove liquidity, fee collects).
 *
 * Required env var:
 *   ALCHEMY_API_KEY  — from dashboard.alchemy.com (free tier: 300M CUs/month)
 *
 * Without a key we fall back to the chain's public RPC (limited, no asset-transfers).
 *
 * Docs: https://docs.alchemy.com/reference/alchemy-getassettransfers
 */

// ── Chain → Alchemy network slug ─────────────────────────────────────────────

const ALCHEMY_NETWORKS: Record<string, string> = {
  ethereum:  "eth-mainnet",
  base:      "base-mainnet",
  arbitrum:  "arb-mainnet",
  optimism:  "opt-mainnet",
  polygon:   "polygon-mainnet",
  bsc:       "bnb-mainnet",
  avalanche: "avax-mainnet",
};

function alchemyUrl(chainId: string): string | null {
  const network = ALCHEMY_NETWORKS[chainId];
  if (!network) return null;
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return null;
  return `https://${network}.g.alchemy.com/v2/${key}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssetTransfer {
  blockNum: string;         // hex block number
  hash: string;             // tx hash
  from: string;
  to: string | null;
  value: number | null;     // token value (human-readable)
  erc721TokenId: string | null;
  asset: string | null;     // token symbol
  category: string;         // "erc20" | "erc721" | "erc1155" | "internal" | "external"
  rawContract: {
    value: string | null;
    address: string | null;
    decimal: string | null;
  };
  metadata: {
    blockTimestamp: string | null;
  };
}

export interface AlchemyTransfersResult {
  transfers: AssetTransfer[];
  pageKey?: string;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

/**
 * Fetch asset transfers for a wallet address on a given chain.
 * Paginates automatically up to `maxPages` (default 5).
 */
export async function getAssetTransfers(
  chainId: string,
  address: string,
  opts: {
    fromBlock?: string;   // hex or "0x0"
    toBlock?: string;     // hex or "latest"
    category?: string[];  // default: ["erc20", "erc721"]
    maxPages?: number;
  } = {}
): Promise<AssetTransfer[]> {
  const url = alchemyUrl(chainId);
  if (!url) {
    console.warn(`[alchemy] No API key or unsupported chain "${chainId}" — skipping`);
    return [];
  }

  const {
    fromBlock = "0x0",
    toBlock = "latest",
    category = ["erc20", "erc721", "erc1155"],
    maxPages = 5,
  } = opts;

  const all: AssetTransfer[] = [];
  let pageKey: string | undefined;
  let page = 0;

  do {
    const params: Record<string, unknown> = {
      fromBlock,
      toBlock,
      toAddress: address,
      category,
      withMetadata: true,
      excludeZeroValue: true,
      maxCount: "0x3e8", // 1000 per page
    };
    if (pageKey) params.pageKey = pageKey;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "alchemy_getAssetTransfers",
          params: [params],
        }),
      });

      if (!res.ok) {
        console.error(`[alchemy] ${chainId} transfers failed: ${res.status}`);
        break;
      }

      const json = (await res.json()) as {
        result?: AlchemyTransfersResult;
        error?: { message: string };
      };

      if (json.error) {
        console.error(`[alchemy] RPC error: ${json.error.message}`);
        break;
      }

      const result = json.result;
      if (!result) break;

      all.push(...result.transfers);
      pageKey = result.pageKey;
      page++;
    } catch (err) {
      console.error("[alchemy] fetch error:", err);
      break;
    }
  } while (pageKey && page < maxPages);

  return all;
}
