// Solana chain adapter — uses @solana/web3.js for native SOL and SPL token balances.
// Requires: npm install @solana/web3.js @solana/spl-token

import type { ChainAdapter } from "../types";
import type { TokenBalanceData } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { getTokenAccountsForWallet, getSolanaConnection } from "./token-accounts";
import { resolveTokenMeta } from "./token-list";

// Known Solana tokens with metadata
export const SOLANA_TOKENS = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    decimals: 9,
    coingeckoId: "solana",
  },
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    decimals: 6,
    coingeckoId: "tether",
  },
  JUP: {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    decimals: 6,
    coingeckoId: "jupiter-exchange-solana",
  },
  RAY: {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    decimals: 6,
    coingeckoId: "raydium",
  },
  ORCA: {
    address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    symbol: "ORCA",
    decimals: 6,
    coingeckoId: "orca",
  },
};

export const DEFAULT_SOLANA_TOKEN_ADDRESSES = Object.values(SOLANA_TOKENS).map(
  (t) => t.address
);

const tokenMetaByAddress = Object.fromEntries(
  Object.values(SOLANA_TOKENS).map((t) => [t.address, t])
);

export class SolanaChainAdapter implements ChainAdapter {
  readonly chainId = "solana";
  readonly chainType = "svm" as const;

  async getNativeBalance(address: string): Promise<bigint> {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return BigInt(lamports);
  }

  async getTokenBalances(
    address: string,
    _tokenAddresses: string[]
  ): Promise<TokenBalanceData[]> {
    // Uses shared cache — same RPC call is reused by all Solana DeFi adapters
    const { accounts } = await getTokenAccountsForWallet(address);

    const balances: TokenBalanceData[] = [];

    for (const acct of accounts) {
      if (acct.amount === "0") continue;

      // Skip NFT-like tokens (position NFTs, etc.)
      if (acct.amount === "1" && acct.decimals === 0) continue;

      const knownMeta = tokenMetaByAddress[acct.mint];
      let symbol = knownMeta?.symbol;

      if (!symbol) {
        const resolved = await resolveTokenMeta(acct.mint);
        symbol = resolved?.symbol ?? acct.mint.slice(0, 6) + "...";
      }

      balances.push({
        tokenAddress: acct.mint,
        symbol,
        decimals: acct.decimals,
        balance: BigInt(acct.amount),
        formattedBalance: acct.uiAmount?.toString() ?? "0",
      });
    }

    return balances;
  }
}
