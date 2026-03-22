# LiquidArc

Personal DeFi portfolio tracker that connects to Web3 wallets and displays real-time token balances, LP positions, and P&L analysis across multiple chains and protocols.

## Supported Chains & Protocols

| Chain | Protocols |
|-------|-----------|
| **Base** | Aerodrome CL |
| **Optimism** | Velodrome V2 |
| **Ethereum** | Uniswap V3 |
| **Arbitrum** | Uniswap V3 |
| **Solana** | Orca CLMM, Raydium CLMM, Meteora Stable |

## Features

- **Multi-wallet tracking** — EVM and Solana wallets, auto-detected by address format
- **LP position analytics** — fees earned, emissions (AERO, VELO, RAY), impermanent loss, APR
- **P&L tracking** — 24h / 7d / 30d with historical snapshots and entry cost basis
- **Pool explorer** — search/filter pools by protocol, chain, token pair, TVL, volume, APR
- **Market data** — global stats, trending coins, sentiment, categories (via CoinGecko)
- **LP simulator** — model positions across price ranges, fee tiers, and time horizons
- **Alerts** (schema-ready) — price changes, out-of-range, IL thresholds, fee milestones
- **Auth & tiers** — email/password registration, session-based auth, free/pro/enterprise tiers
- **Rate limiting** — per-tier limits (auth 5/min, API 30/min, public 10/min)

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env with your database and RPC settings

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
├── app/                    # Next.js App Router (pages + 25+ API routes)
│   ├── dashboard/          # Protected portfolio dashboard
│   ├── market/             # Crypto market data
│   ├── pools/              # Pool analytics explorer
│   ├── simulator/          # LP position simulator
│   ├── protocols/          # Protocol-specific views
│   ├── knowledge/          # Educational articles
│   └── api/                # REST API (auth, portfolio, wallets, prices, pools, market)
├── components/             # React components
│   ├── providers/          # SessionProvider, PortfolioCacheProvider
│   ├── wallet/             # ConnectButton (auth), WalletPanel (address tracking)
│   ├── dashboard/          # Portfolio UI, TokenList, LPPositions, Charts
│   └── layout/             # AppHeader, AppLayout, RouteProgress
├── hooks/                  # usePortfolio, useAuth, usePrices, useTrackedWallets, etc.
├── lib/
│   ├── chain/              # Chain Abstraction Layer
│   │   ├── types.ts        # ChainAdapter interface
│   │   ├── factory.ts      # Adapter registry by chainId
│   │   ├── base/           # Base chain adapter (viem)
│   │   ├── evm/            # Generic EVM adapter (Optimism, Arbitrum, Ethereum)
│   │   └── solana/         # Solana/SVM adapter
│   ├── defi/               # DeFi protocol adapters (plugin registry)
│   │   ├── aerodrome/      # Aerodrome CL (Base)
│   │   ├── velodrome/      # Velodrome V2 (Optimism)
│   │   ├── uniswap-v3/     # Uniswap V3 (multi-chain)
│   │   ├── orca/           # Orca CLMM (Solana)
│   │   ├── raydium/        # Raydium CLMM (Solana)
│   │   └── meteora/        # Meteora Stable (Solana)
│   ├── pricing/            # Multi-source price aggregation (CoinGecko, Jupiter, DexScreener)
│   ├── portfolio/          # Portfolio orchestration, snapshots, P&L calculation
│   ├── market/             # Market data aggregation
│   ├── auth/               # iron-session auth + tier management
│   ├── simulator/          # Simulation engine
│   └── db/                 # Prisma client singleton
├── backend/                # Standalone ingestion server (pool sync + cron)
└── types/                  # Shared TypeScript interfaces
```

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **viem** — on-chain reads (Base, Optimism, Arbitrum, Ethereum)
- **@solana/web3.js + @solana/spl-token** — Solana wallet & token reads
- **PostgreSQL 16 + Prisma 5** — persistence & snapshots
- **TailwindCSS** — UI styling
- **Recharts** — portfolio charts & data visualization
- **CoinGecko + Jupiter + DexScreener** — price feeds
- **iron-session** — encrypted cookie-based sessions
- **Resend** — transactional email
- **Sentry** — error tracking
- **Docker** — multi-stage production builds

## Environment Variables

```env
DATABASE_URL=postgresql://liquidark:liquidark@localhost:5433/liquidark
BASE_RPC_URL=https://mainnet.base.org
COINGECKO_API_KEY=                      # Optional
COINGECKO_API_URL=https://api.coingecko.com/api/v3
INGEST_SECRET=                          # For backend pool ingestion
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

- **Frontend:** Vercel or Docker (`Dockerfile`)
- **Backend ingestion server:** Railway or Docker (`Dockerfile.backend`)
- **Database:** Any managed PostgreSQL (Railway, Supabase, Neon, etc.)

## Roadmap

- **Phase 1** ✅ Base chain — token balances, Aerodrome LP, P&L dashboard
- **Phase 2** ✅ Multi-chain — Solana (Orca, Raydium, Meteora), Optimism (Velodrome), Uniswap V3
- **Phase 3:** LP Automation — rebalancing, range adjustments via smart contract proxy
- **Phase 4:** Alerts — price alerts, IL warnings, out-of-range notifications
- **Phase 5:** Multi-user SaaS — Stripe billing, expanded tiers
