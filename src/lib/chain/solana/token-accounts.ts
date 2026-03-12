// Shared Solana token accounts cache
//
// Avoids redundant getParsedTokenAccountsByOwner RPC calls across
// the Solana chain adapter + all Solana DeFi position adapters.

import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const SPL_TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const TOKEN_2022_PROGRAM = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export interface ParsedTokenAccount {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
}

interface CacheEntry {
  accounts: ParsedTokenAccount[];
  nftMints: Set<string>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();
const CACHE_TTL_MS = 30_000; // 30 seconds

let sharedConnection: Connection | null = null;

function getConnection(): Connection {
  if (!sharedConnection) {
    sharedConnection = new Connection(RPC_URL, "confirmed");
  }
  return sharedConnection;
}

export { getConnection as getSolanaConnection };

/**
 * Get all parsed SPL token accounts for a wallet, with caching.
 * Returns both the full account list and a pre-filtered set of NFT mints.
 */
export async function getTokenAccountsForWallet(
  address: string
): Promise<{ accounts: ParsedTokenAccount[]; nftMints: Set<string> }> {
  const cached = cache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { accounts: cached.accounts, nftMints: cached.nftMints };
  }

  // Deduplicate in-flight requests
  let pending = inflight.get(address);
  if (!pending) {
    pending = fetchAndCache(address);
    inflight.set(address, pending);
  }

  const result = await pending;
  inflight.delete(address);
  return { accounts: result.accounts, nftMints: result.nftMints };
}

async function fetchAndCache(address: string): Promise<CacheEntry> {
  const connection = getConnection();
  const pubkey = new PublicKey(address);

  // Query both SPL Token and Token-2022 in parallel
  const [splAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: SPL_TOKEN_PROGRAM,
    }),
    connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_2022_PROGRAM,
    }),
  ]);

  const accounts: ParsedTokenAccount[] = [];
  const nftMints = new Set<string>();

  for (const { account } of [
    ...splAccounts.value,
    ...token2022Accounts.value,
  ]) {
    const parsed = account.data.parsed;
    if (parsed.type !== "account") continue;

    const info = parsed.info;
    const entry: ParsedTokenAccount = {
      mint: info.mint,
      amount: info.tokenAmount.amount,
      decimals: info.tokenAmount.decimals,
      uiAmount: info.tokenAmount.uiAmount,
    };

    accounts.push(entry);

    // NFT-like: amount=1, decimals=0
    if (entry.amount === "1" && entry.decimals === 0) {
      nftMints.add(entry.mint);
    }
  }

  console.log(
    `[token-accounts] ${address}: ${splAccounts.value.length} SPL + ${token2022Accounts.value.length} Token-2022 accounts, ${nftMints.size} NFT mints`
  );

  const cacheEntry: CacheEntry = { accounts, nftMints, timestamp: Date.now() };
  cache.set(address, cacheEntry);
  return cacheEntry;
}
