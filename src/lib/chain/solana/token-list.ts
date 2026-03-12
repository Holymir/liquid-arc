// Solana token metadata resolver
//
// Primary: Jupiter token list API (same source Phantom wallet uses)
// Fallback: Metaplex on-chain token metadata program
// Caches results for fast repeated lookups.

import { PublicKey } from "@solana/web3.js";

interface TokenListEntry {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

let tokenMap: Map<string, TokenListEntry> | null = null;
let fetchPromise: Promise<Map<string, TokenListEntry>> | null = null;

// Jupiter token list — actively maintained, used by Phantom/Jupiter/etc.
const JUPITER_TOKEN_LIST_URL = "https://token.jup.ag/all";

// Metaplex Token Metadata program
const METADATA_PROGRAM = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function loadTokenList(): Promise<Map<string, TokenListEntry>> {
  if (tokenMap) return tokenMap;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(JUPITER_TOKEN_LIST_URL, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Jupiter returns a flat array (not wrapped in { tokens: [...] })
      const tokens: TokenListEntry[] = await res.json();
      const map = new Map<string, TokenListEntry>();
      for (const t of tokens) {
        map.set(t.address, t);
      }
      tokenMap = map;
      console.log(`[solana-tokens] Loaded ${map.size} token entries from Jupiter`);
      return map;
    } catch (err) {
      console.warn("[solana-tokens] Failed to load Jupiter token list:", err);
      tokenMap = new Map();
      return tokenMap;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// Cache for Metaplex on-chain lookups (fallback)
const metaplexCache = new Map<string, { symbol: string; decimals: number } | null>();

/**
 * Resolve token metadata from Metaplex on-chain metadata account.
 * This is the same approach Phantom uses as a fallback.
 */
async function resolveFromMetaplex(
  mintAddress: string
): Promise<{ symbol: string; decimals: number } | null> {
  if (metaplexCache.has(mintAddress)) return metaplexCache.get(mintAddress)!;

  try {
    // Lazy import to avoid circular deps
    const { getSolanaConnection } = await import("./token-accounts");
    const connection = getSolanaConnection();
    const mintPubkey = new PublicKey(mintAddress);

    // Derive metadata PDA: ["metadata", metadata_program, mint]
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METADATA_PROGRAM
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo || accountInfo.data.length < 115) {
      metaplexCache.set(mintAddress, null);
      return null;
    }

    const data = accountInfo.data;

    // Metaplex Metadata v1 layout (Borsh):
    // 1: key (u8)
    // 32: update_authority
    // 32: mint
    // Then Borsh strings: 4-byte length prefix + chars (padded with \0)
    // Name: offset 65, length prefix at 65, string at 69
    // Symbol: after name

    const nameLen = data.readUInt32LE(65);
    const nameStart = 69;
    const nameRaw = data.subarray(nameStart, nameStart + Math.min(nameLen, 32));
    const name = Buffer.from(nameRaw).toString("utf8").replace(/\0/g, "").trim();

    const symbolOffset = nameStart + Math.min(nameLen, 32);
    const symbolLen = data.readUInt32LE(symbolOffset);
    const symbolStart = symbolOffset + 4;
    const symbolRaw = data.subarray(symbolStart, symbolStart + Math.min(symbolLen, 10));
    const symbol = Buffer.from(symbolRaw).toString("utf8").replace(/\0/g, "").trim();

    if (!symbol) {
      metaplexCache.set(mintAddress, null);
      return null;
    }

    // Get decimals from the mint account itself
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
    let decimals = 9;
    if (mintInfo.value?.data && "parsed" in mintInfo.value.data) {
      decimals = mintInfo.value.data.parsed.info?.decimals ?? 9;
    }

    const result = { symbol, decimals };
    metaplexCache.set(mintAddress, result);
    return result;
  } catch {
    metaplexCache.set(mintAddress, null);
    return null;
  }
}

/**
 * Resolve token symbol and decimals.
 * 1. Jupiter token list (fast, covers most tokens)
 * 2. Metaplex on-chain metadata (fallback, covers everything with metadata)
 */
export async function resolveTokenMeta(
  mintAddress: string
): Promise<{ symbol: string; decimals: number } | null> {
  const map = await loadTokenList();
  const entry = map.get(mintAddress);
  if (entry) return { symbol: entry.symbol, decimals: entry.decimals };

  // Fallback: Metaplex on-chain metadata (same as Phantom)
  return resolveFromMetaplex(mintAddress);
}

/**
 * Batch-resolve token symbols. Returns a map of address → symbol.
 */
export async function resolveTokenSymbols(
  mintAddresses: string[]
): Promise<Map<string, string>> {
  const map = await loadTokenList();
  const result = new Map<string, string>();
  for (const addr of mintAddresses) {
    const entry = map.get(addr);
    if (entry) result.set(addr, entry.symbol);
  }
  return result;
}
