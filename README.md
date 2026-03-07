# LiquidArk

Personal DeFi portfolio tracker. Connects to Web3 wallets and displays real-time token balances, LP positions, and P&L. Built on Base chain with multi-chain architecture ready for Solana expansion.

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- WalletConnect Project ID — get one at [cloud.walletconnect.com](https://cloud.walletconnect.com)

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env and add your NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# 2. Start postgres + dev server
make dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start Postgres + Next.js dev server |
| `make build` | Production build |
| `make db-push` | Push Prisma schema to database |
| `make db-studio` | Open Prisma Studio (database GUI) |
| `make db-reset` | Drop and recreate database schema |
| `make stop` | Stop Docker services |

## Architecture

```
src/
├── app/                    # Next.js App Router (pages + API routes)
├── components/             # React components
│   ├── providers/          # Web3Provider (wagmi + RainbowKit)
│   ├── wallet/             # ConnectButton, WalletSelector, NetworkBadge
│   └── dashboard/          # Portfolio UI components
├── hooks/                  # usePortfolio, useWalletSync, usePrices
├── lib/
│   ├── chain/              # Chain Abstraction Layer (EVM + Solana-ready)
│   │   ├── types.ts        # ChainAdapter interface (no viem imports)
│   │   ├── factory.ts      # Adapter factory by chainId
│   │   └── base/           # Base chain implementation (viem)
│   ├── defi/               # DeFi protocol adapters
│   │   └── aerodrome/      # Aerodrome CL position reader
│   ├── pricing/            # CoinGecko + DexScreener price feeds
│   ├── portfolio/          # Portfolio orchestration + P&L + snapshots
│   ├── db/                 # Prisma client singleton
│   └── wagmi/              # wagmi config
└── types/                  # Shared TypeScript types
```

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **wagmi v2 + RainbowKit** — EVM wallet connection
- **viem** — on-chain reads (Base)
- **PostgreSQL 16 + Prisma 5** — persistence
- **TailwindCSS + shadcn/ui** — UI
- **Recharts** — portfolio charts
- **CoinGecko + DexScreener** — price feeds

## Environment Variables

```env
DATABASE_URL=postgresql://liquidark:liquidark@localhost:5433/liquidark
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # Required
BASE_RPC_URL=https://mainnet.base.org
COINGECKO_API_KEY=                      # Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Roadmap

- **Phase 1 (current):** Base chain — token balances, Aerodrome LP, P&L dashboard
- **Phase 2:** Solana support — SVM chain adapter, Raydium/Orca LP positions
- **Phase 3:** LP Automation — rebalancing, range adjustments via smart contract proxy
- **Phase 4:** Alerts — price alerts, IL warnings, out-of-range notifications
- **Phase 5:** Multi-user — SIWE auth, user accounts, SaaS billing
