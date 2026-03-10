// Solana chain adapter — uses @solana/web3.js for native SOL and SPL token balances.
// Requires: npm install @solana/web3.js @solana/spl-token

import type { ChainAdapter } from "../types";
import type { TokenBalanceData } from "@/types";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

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
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  async getNativeBalance(address: string): Promise<bigint> {
    const pubkey = new PublicKey(address);
    const lamports = await this.connection.getBalance(pubkey);
    return BigInt(lamports);
  }

  async getTokenBalances(
    address: string,
    _tokenAddresses: string[]
  ): Promise<TokenBalanceData[]> {
    const pubkey = new PublicKey(address);

    // Fetch all SPL token accounts for this wallet in one RPC call
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      pubkey,
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    const balances: TokenBalanceData[] = [];

    for (const { account } of tokenAccounts.value) {
      const parsed = account.data.parsed;
      if (parsed.type !== "account") continue;

      const info = parsed.info;
      const mint: string = info.mint;
      const amount: string = info.tokenAmount.amount;
      const decimals: number = info.tokenAmount.decimals;
      const uiAmount: number | null = info.tokenAmount.uiAmount;

      if (amount === "0") continue;

      const knownMeta = tokenMetaByAddress[mint];

      balances.push({
        tokenAddress: mint,
        symbol: knownMeta?.symbol ?? "???",
        decimals,
        balance: BigInt(amount),
        formattedBalance: uiAmount?.toString() ?? "0",
      });
    }

    return balances;
  }
}
