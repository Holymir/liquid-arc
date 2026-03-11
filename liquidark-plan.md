# LiquidArc — Project Plan & Claude Code Tasks

## Vision

LiquidArc is a personal crypto portfolio tracker that connects directly to your Web3 wallet (MetaMask, Rabby, Coinbase Wallet, etc.) and displays real-time portfolio value, token balances, LP positions, and P&L. The POC tracks wallets on Base chain, but the architecture supports multi-chain and multi-wallet expansion. A future phase will add automated LP position management (rebalancing, range adjustments) acting as a proxy to DEXes like Aerodrome.

## Tech Stack

- **Framework:** Next.js 14 (App Router) — full-stack TypeScript monorepo
- **Blockchain:** viem + wagmi for EVM interaction, RainbowKit for wallet connection UI
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** TailwindCSS + shadcn/ui
- **Price feeds:** CoinGecko API (free tier), DexScreener API as fallback
- **Charts:** Recharts for portfolio history
- **Containerization:** Docker Compose for local dev (postgres only, Next.js runs native with `npm run dev`)

## Architecture Principles

- Full-stack TypeScript monorepo — shared types between frontend and API routes
- Chain Abstraction Layer — a common `ChainAdapter` interface with per-chain implementations
- Web3 wallet-first — user connects wallet via browser extension, no manual address entry needed (but still supported)
- Multi-wallet ready from day one — DB schema includes `wallet_id` + `chain_id` on all relevant tables
- Server-side RPC calls — blockchain reads happen in Next.js API routes, not in the browser (avoids RPC rate limits and keeps logic centralized)

---

## Project Structure

```
liquidark/
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── layout.tsx                      # Root layout with Web3Provider
│   │   ├── page.tsx                        # Landing / connect wallet
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # Main portfolio dashboard
│   │   └── api/                            # API routes (server-side)
│   │       ├── wallets/
│   │       │   └── route.ts                # GET (list) / POST (add wallet)
│   │       ├── portfolio/
│   │       │   ├── [address]/
│   │       │   │   ├── route.ts            # GET full portfolio
│   │       │   │   └── history/
│   │       │   │       └── route.ts        # GET historical snapshots
│   │       │   └── refresh/
│   │       │       └── route.ts            # POST force refresh
│   │       └── prices/
│   │           └── route.ts                # GET batch price lookup
│   │
│   ├── components/
│   │   ├── providers/
│   │   │   └── Web3Provider.tsx            # wagmi + RainbowKit config
│   │   ├── wallet/
│   │   │   ├── ConnectButton.tsx           # RainbowKit connect button wrapper
│   │   │   ├── WalletSelector.tsx          # Switch between connected wallets
│   │   │   └── NetworkBadge.tsx            # Show connected chain
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx               # Main portfolio view
│   │   │   ├── PortfolioHeader.tsx         # Total value + P&L
│   │   │   ├── TokenList.tsx               # Token balances table
│   │   │   ├── LPPositions.tsx             # LP position cards
│   │   │   └── PortfolioChart.tsx          # Historical value chart
│   │   └── ui/                             # shadcn/ui components
│   │
│   ├── hooks/
│   │   ├── usePortfolio.ts                 # Fetch + poll portfolio data
│   │   ├── useWalletSync.ts               # Sync connected wallet to backend
│   │   └── usePrices.ts                    # Price feed hook
│   │
│   ├── lib/
│   │   ├── chain/                          # Chain Abstraction Layer
│   │   │   ├── types.ts                    # ChainAdapter interface + shared types
│   │   │   ├── factory.ts                  # Returns adapter by chainId
│   │   │   └── base/
│   │   │       ├── adapter.ts              # BaseChainAdapter implementation
│   │   │       ├── client.ts               # viem public client for Base
│   │   │       └── tokens.ts               # Known Base token addresses + metadata
│   │   │
│   │   ├── defi/                           # DeFi protocol integrations
│   │   │   ├── types.ts                    # DefiProtocolAdapter interface
│   │   │   └── aerodrome/
│   │   │       ├── adapter.ts              # Read Aerodrome CL positions
│   │   │       ├── abi.ts                  # Aerodrome contract ABIs
│   │   │       └── math.ts                 # Tick math / liquidity calculations (Uni V3)
│   │   │
│   │   ├── pricing/
│   │   │   ├── service.ts                  # PricingService — CoinGecko + DexScreener
│   │   │   ├── coingecko.ts                # CoinGecko client
│   │   │   └── dexscreener.ts              # DexScreener client
│   │   │
│   │   ├── portfolio/
│   │   │   ├── service.ts                  # Portfolio orchestration
│   │   │   ├── pnl.ts                      # P&L calculations from snapshots
│   │   │   └── snapshot.ts                 # Snapshot creation logic
│   │   │
│   │   ├── db/
│   │   │   └── prisma.ts                   # Prisma client singleton
│   │   │
│   │   └── wagmi/
│   │       └── config.ts                   # wagmi config: chains, transports, connectors
│   │
│   └── types/
│       └── index.ts                        # Shared TypeScript types/interfaces
│
├── prisma/
│   └── schema.prisma                       # Database schema
│
├── public/
│   └── logo.svg
│
├── docker-compose.yml                      # PostgreSQL for local dev
├── .env.example                            # Environment variables template
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Wallet {
  id              String             @id @default(uuid())
  address         String
  chainId         String             @map("chain_id")
  label           String?
  isActive        Boolean            @default(true) @map("is_active")
  createdAt       DateTime           @default(now()) @map("created_at")
  tokenBalances   TokenBalance[]
  lpPositions     LPPosition[]
  snapshots       PortfolioSnapshot[]

  @@unique([address, chainId])
  @@map("wallets")
}

model TokenBalance {
  id            String   @id @default(uuid())
  walletId      String   @map("wallet_id")
  tokenAddress  String   @map("token_address")   // "0xNATIVE" for ETH
  symbol        String?
  decimals      Int?
  balance       String                            // raw balance as string (BigInt safe)
  usdValue      Float?   @map("usd_value")
  lastUpdated   DateTime @default(now()) @map("last_updated")
  wallet        Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@map("token_balances")
}

model LPPosition {
  id             String   @id @default(uuid())
  walletId       String   @map("wallet_id")
  protocol       String                           // "aerodrome", "uniswap", etc.
  poolAddress    String   @map("pool_address")
  token0Address  String   @map("token0_address")
  token0Symbol   String?  @map("token0_symbol")
  token1Address  String   @map("token1_address")
  token1Symbol   String?  @map("token1_symbol")
  liquidity      String                           // BigInt as string
  tickLower      Int?     @map("tick_lower")
  tickUpper      Int?     @map("tick_upper")
  token0Amount   Float?   @map("token0_amount")
  token1Amount   Float?   @map("token1_amount")
  usdValue       Float?   @map("usd_value")
  feesEarnedUsd  Float?   @map("fees_earned_usd")
  lastUpdated    DateTime @default(now()) @map("last_updated")
  wallet         Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@map("lp_positions")
}

model PortfolioSnapshot {
  id             String   @id @default(uuid())
  walletId       String   @map("wallet_id")
  totalUsdValue  Float    @map("total_usd_value")
  tokenBreakdown Json?    @map("token_breakdown")  // { "ETH": 1234.56, "USDC": 5000.00 }
  lpBreakdown    Json?    @map("lp_breakdown")      // { "AERO-USDC": 2500.00 }
  snapshotAt     DateTime @default(now()) @map("snapshot_at")
  wallet         Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@index([walletId, snapshotAt(sort: Desc)])
  @@map("portfolio_snapshots")
}
```

---

## Chain Adapter Interface

```typescript
// src/lib/chain/types.ts

export interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: bigint;         // raw balance
  formattedBalance: string; // human-readable
}

export interface ChainAdapter {
  chainId: string;
  getNativeBalance(address: string): Promise<bigint>;
  getTokenBalances(address: string, tokenAddresses: string[]): Promise<TokenBalance[]>;
  getTransactionHistory(address: string, limit: number): Promise<Transaction[]>;
}

export interface DefiProtocolAdapter {
  protocolName: string;
  chainId: string;
  getLPPositions(address: string): Promise<LPPositionData[]>;
  // Future: adjustPosition(), removePosition(), etc.
}
```

---

## Web3 Wallet Connection Architecture

### Flow

1. User visits LiquidArc → sees landing page with "Connect Wallet" button
2. RainbowKit modal opens → user selects MetaMask / Rabby / WalletConnect / Coinbase Wallet
3. On successful connection:
   - `useWalletSync` hook detects connected address + chainId
   - Auto-registers wallet in backend DB (POST /api/wallets) if not exists
   - Redirects to /dashboard
   - Fetches portfolio data for the connected address
4. User can disconnect or switch wallets via the RainbowKit button in the header
5. Manual wallet add is still available for watch-only tracking (no signing required)

### wagmi + RainbowKit Config

```typescript
// src/lib/wagmi/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'LiquidArc',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [base, mainnet, arbitrum],  // Base is primary, others prepared
  ssr: true,
});
```

### Web3Provider Wrapper

```tsx
// src/components/providers/Web3Provider.tsx
'use client';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi/config';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Wallet Sync Hook

```typescript
// src/hooks/useWalletSync.ts
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

export function useWalletSync() {
  const { address, chainId, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address && chainId) {
      // Register wallet in backend if not exists
      fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          chainId: chainIdToString(chainId), // 8453 → "base"
          label: 'Connected Wallet',
        }),
      }).catch(console.error);
    }
  }, [address, chainId, isConnected]);

  return { address, chainId, isConnected };
}
```

---

## POC Scope (Phase 1)

1. Web3 wallet connection via RainbowKit (MetaMask, Rabby, WalletConnect, Coinbase Wallet)
2. Auto-detect connected wallet address and chain
3. Read native ETH balance + ERC20 token balances on Base
4. Read Aerodrome CL LP positions on Base
5. Fetch USD prices for all tokens
6. Compute total portfolio value + P&L
7. Store periodic snapshots
8. Display on a React dashboard with portfolio chart
9. Support watch-only wallets (manual address entry without signing)

---

## Claude Code Tasks — Step by Step

Execute these tasks in order. Each task should be a working, testable increment.

### Task 1: Project Scaffolding

Scaffold the full project structure.

- Initialize Next.js 14 project with TypeScript and App Router
- Install and configure TailwindCSS + shadcn/ui
- Install dependencies: wagmi, @rainbow-me/rainbowkit, viem, @tanstack/react-query, prisma, @prisma/client, recharts
- Create all directories matching the project structure above (empty files with TODO comments are fine)
- Create `prisma/schema.prisma` exactly as defined above
- Create `docker-compose.yml` with PostgreSQL 16 (port 5433 to avoid conflicts)
- Create `.env.example` with all required environment variables:
  ```
  DATABASE_URL=postgresql://liquidark:liquidark@localhost:5433/liquidark
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
  COINGECKO_API_KEY=optional
  BASE_RPC_URL=https://mainnet.base.org
  ```
- Create `.env` from `.env.example` with dev defaults
- Run `npx prisma generate` and `npx prisma db push` to verify schema
- Create `README.md` with project description, setup instructions, and architecture overview

**Verify:** `docker-compose up -d` starts postgres, `npx prisma db push` creates tables, `npm run dev` starts Next.js on localhost:3000.

---

### Task 2: Web3 Wallet Connection

Implement wallet connection with RainbowKit + wagmi.

- Implement `src/lib/wagmi/config.ts` — wagmi config with Base as primary chain, include mainnet + arbitrum as prepared chains
- Implement `src/components/providers/Web3Provider.tsx` — wraps app with WagmiProvider + RainbowKitProvider + QueryClientProvider
- Update `src/app/layout.tsx` to wrap children with Web3Provider
- Implement `src/components/wallet/ConnectButton.tsx` — styled RainbowKit ConnectButton with custom theme matching the app
- Implement `src/components/wallet/NetworkBadge.tsx` — shows the connected chain name + icon
- Implement landing page `src/app/page.tsx`:
  - App logo + name "LiquidArc"
  - "Connect Wallet" button (prominent, centered)
  - Brief tagline: "Track your DeFi portfolio across chains"
  - If wallet already connected, redirect to /dashboard
- Style everything with TailwindCSS — dark theme, clean, crypto-native aesthetic

**Verify:** Visit localhost:3000, click "Connect Wallet", MetaMask popup opens, wallet connects, page shows connected address and chain.

---

### Task 3: Wallet Management API + Sync

Backend wallet CRUD and auto-sync on wallet connect.

- Implement `src/lib/db/prisma.ts` — Prisma client singleton (handle hot reload in dev)
- Implement `src/app/api/wallets/route.ts`:
  - `GET` — list all wallets
  - `POST` — add wallet (address + chainId + optional label), upsert on unique constraint
- Implement `src/hooks/useWalletSync.ts`:
  - Listens to wagmi's `useAccount` for address/chain changes
  - On connect: POST to /api/wallets to register (idempotent upsert)
  - On chain switch: register new wallet entry for the new chain
  - On disconnect: no deletion, just stop tracking
- Implement `src/components/wallet/WalletSelector.tsx`:
  - Shows connected wallet address (truncated) with chain badge
  - "Add Watch Wallet" button — modal with address input for watch-only tracking
  - Dropdown to switch between tracked wallets
- Add utility: `chainIdToString(chainId: number): string` — maps 8453 → "base", 1 → "ethereum", etc.

**Verify:** Connect wallet → wallet appears in DB. Disconnect and reconnect → no duplicates. Add a watch-only wallet via the UI → appears in wallet list.

---

### Task 4: Base Chain Adapter — Read Wallet Balances

Implement the ChainAdapter for Base to read on-chain balances.

- Implement `src/lib/chain/types.ts` — ChainAdapter interface as defined above
- Implement `src/lib/chain/base/client.ts` — viem public client for Base chain:
  ```typescript
  import { createPublicClient, http } from 'viem';
  import { base } from 'viem/chains';
  export const baseClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
  });
  ```
- Implement `src/lib/chain/base/tokens.ts` — known Base tokens with contract addresses:
  - WETH, USDC, USDbC, AERO, cbETH, DAI (addresses hardcoded)
- Implement `src/lib/chain/base/adapter.ts` — BaseChainAdapter:
  - `getNativeBalance()` — `baseClient.getBalance()`
  - `getTokenBalances()` — multicall to ERC20 `balanceOf` + `decimals` + `symbol` for each token
  - Use viem's `multicall` to batch RPC calls efficiently
- Implement `src/lib/chain/factory.ts` — map-based factory returning adapter by chainId

**Verify:** Call `baseAdapter.getTokenBalances("0xYOUR_WALLET")` in a test API route and get real on-chain balances back.

---

### Task 5: Price Feeds

Implement pricing module to fetch USD prices.

- Implement `src/lib/pricing/coingecko.ts`:
  - `getTokenPrices(chainId: string, addresses: string[]): Promise<Map<string, number>>`
  - Calls `https://api.coingecko.com/api/v3/simple/token_price/{platform}` with contract addresses
  - Platform mapping: "base" → "base", "ethereum" → "ethereum"
  - In-memory cache with 60-second TTL (simple Map + timestamp)
- Implement `src/lib/pricing/dexscreener.ts`:
  - Fallback client: `https://api.dexscreener.com/latest/dex/tokens/{address}`
  - Extract USD price from response
- Implement `src/lib/pricing/service.ts`:
  - `PricingService.getPrices(chainId, tokenAddresses)` — tries CoinGecko, falls back to DexScreener for misses
  - Returns `Map<string, number>` (address → USD price)
- Implement `src/app/api/prices/route.ts`:
  - `GET /api/prices?tokens=0x...,0x...&chainId=base`

**Verify:** Call the prices API with AERO and USDC addresses → get valid USD prices back.

---

### Task 6: Aerodrome LP Position Reader

Read concentrated liquidity positions from Aerodrome on Base.

- Implement `src/lib/defi/types.ts` — DefiProtocolAdapter interface
- Implement `src/lib/defi/aerodrome/abi.ts` — ABI fragments for:
  - NonfungiblePositionManager: `balanceOf`, `tokenOfOwnerByIndex`, `positions`
  - CL Pool: `slot0`, `token0`, `token1`
- Implement `src/lib/defi/aerodrome/math.ts`:
  - `getAmountsForLiquidity(liquidity, sqrtPriceX96, tickLower, tickUpper)` — Uniswap V3 math
  - `tickToPrice(tick, decimals0, decimals1)`
- Implement `src/lib/defi/aerodrome/adapter.ts`:
  - Get all NFT position IDs owned by wallet
  - For each position: read pool, tokens, liquidity, tick range
  - Calculate token amounts using the math module
  - Return structured LPPosition data
- Use viem multicall to batch all contract reads

**Verify:** For a wallet with Aerodrome CL positions, adapter returns position details with correct token amounts.

---

### Task 7: Portfolio Service & Snapshots

Wire everything together — main portfolio orchestration.

- Implement `src/lib/portfolio/service.ts`:
  - `getPortfolio(address: string, chainId: string)`:
    1. Get chain adapter from factory
    2. Fetch native balance + token balances
    3. Fetch LP positions via AerodromeAdapter
    4. Fetch prices for all tokens involved
    5. Calculate USD values
    6. Upsert TokenBalance and LPPosition records in DB
    7. Return complete PortfolioResponse
- Implement `src/lib/portfolio/snapshot.ts`:
  - `createSnapshot(address, chainId)` — saves PortfolioSnapshot to DB
- Implement `src/lib/portfolio/pnl.ts`:
  - `calculatePnL(walletId, period: '24h' | '7d' | '30d')` — compare current vs historical snapshot
  - Returns { absoluteChange, percentChange }
- Implement API routes:
  - `GET /api/portfolio/[address]?chainId=base` — full portfolio
  - `GET /api/portfolio/[address]/history?period=7d` — historical snapshots
  - `POST /api/portfolio/refresh` — force refresh
- Add a cron-like mechanism using Next.js API route + external trigger (Vercel Cron or simple setInterval in dev) to snapshot every hour

**Verify:** Hit `/api/portfolio/0xYOUR_WALLET?chainId=base` and get complete portfolio with token balances, LP positions, and USD values.

---

### Task 8: Dashboard Frontend

Build the portfolio dashboard UI.

- Implement `src/hooks/usePortfolio.ts`:
  - Fetches portfolio from API using connected wallet address
  - Polls every 60 seconds
  - Handles loading / error / empty states
- Implement `src/components/dashboard/PortfolioHeader.tsx`:
  - Total portfolio value (large, prominent number)
  - 24h / 7d / 30d P&L with green/red color coding
  - Last updated timestamp
- Implement `src/components/dashboard/TokenList.tsx`:
  - Table: Token Icon | Symbol | Balance | USD Value | 24h %
  - Sorted by USD value descending
  - Clickable rows → link to block explorer
- Implement `src/components/dashboard/LPPositions.tsx`:
  - Card per position: Pool pair, Total USD value, Token0 amount, Token1 amount, Tick range (in/out of range indicator), Fees earned
- Implement `src/components/dashboard/PortfolioChart.tsx`:
  - Line chart (Recharts) showing portfolio value over time
  - Period toggle: 7d / 30d / 90d
  - Tooltip with exact values on hover
- Implement `src/app/dashboard/page.tsx`:
  - Protected: redirect to / if no wallet connected
  - Layout: Header (wallet info + connect button) → PortfolioHeader → Chart → TokenList → LPPositions
- Dark theme throughout — think Zapper/DeBank aesthetic: dark bg (#0a0a0f), neon green for gains, red for losses, subtle card borders

**Verify:** Connect wallet → dashboard shows real portfolio data with live prices. Chart renders. Token list and LP positions display correctly.

---

### Task 9: Polish & Deployment Setup

Final polish and make it deployable.

- Add error boundaries and loading skeletons for all dashboard components
- Add toast notifications (shadcn/ui toast) for: wallet connected, portfolio refreshed, errors
- Add responsive design — works on mobile (important for checking portfolio on the go)
- Create `Dockerfile` for production:
  - Multi-stage: deps → build → runner
  - Standalone Next.js output
- Update `docker-compose.yml`:
  - PostgreSQL 16 with persistent volume
  - Next.js app service (optional, for self-hosting)
- Add `Makefile`:
  - `make dev` — start postgres + next dev
  - `make build` — production build
  - `make db-push` — push prisma schema
  - `make db-studio` — open Prisma Studio
  - `make reset` — drop and recreate database
- Add proper README.md:
  - Project description and screenshots placeholder
  - Prerequisites (Node 20+, Docker, WalletConnect project ID)
  - Quick start guide
  - Architecture overview
  - Environment variables reference
  - Future roadmap

**Verify:** `make dev` starts the full stack. Dashboard works end-to-end with real wallet data. Mobile responsive. No console errors.

---

## Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://liquidark:liquidark@localhost:5433/liquidark

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # Get from cloud.walletconnect.com
BASE_RPC_URL=https://mainnet.base.org   # Or Alchemy/Infura URL for better reliability

# Price APIs (optional — free tier works without keys)
COINGECKO_API_KEY=
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Future Phases (Do NOT implement yet)

- **Phase 2:** Multi-chain support (Ethereum, Arbitrum, Solana) — add new ChainAdapter implementations
- **Phase 3:** LP Automation Engine — automated rebalancing, range adjustments, compounding via smart contract proxy
- **Phase 4:** Alerts & Notifications — price alerts, IL warnings, position out-of-range alerts (Telegram/Discord bot)
- **Phase 5:** Auth & Multi-user — if opening up beyond personal use (NextAuth + wallet-based SIWE auth)
- **Phase 6:** MiCA compliance layer — if evolving into a licensed digital asset management product
