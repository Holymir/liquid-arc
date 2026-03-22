# LiquidArc — DeFi Portfolio Tracker

## What It Is

LiquidArc is a personal DeFi portfolio tracker. Users sign in with email/password, add wallet addresses (EVM + Solana), and monitor token balances, liquidity provider (LP) positions, and profit/loss across multiple blockchains and protocols in real-time. All on-chain reads are read-only — the app never touches user funds.

## Pages & Sections

### Landing Page (/)

- Hero section with animated LP range card mockup (WETH/USDC position with price range bar, fee chart, P&L)
- Feature highlights: portfolio tracking, yield discovery, strategy simulator
- Scrolling market ticker (top 10 coins via CoinGecko)
- Protocol grid showing supported + upcoming protocols
- Trust signals (non-custodial, multi-chain, open analytics)
- CTA to sign in or explore

### DeFi Overview (/defi)

- DeFiLlama-powered TVL headline with 24h change indicator
- Metrics ticker: stablecoin market cap, DEX 24h volume, perps 24h volume
- Chain filter pills (Ethereum, Solana, BSC, Base, Tron, Bitcoin, Arbitrum, Polygon, Avalanche, Optimism, Sui, Hyperliquid)
- Category filter via sidebar (DEXes, Lending, Bridges, Yield, etc.)
- Historical TVL area chart (left panel)
- Sortable protocol table with TVL, 24h change, 7d change, category, chain (right panel)
- Side-by-side layout on desktop, stacked on mobile

### Dashboard (/dashboard)

- Portfolio summary: total USD value, 24h/7d/30d P&L with green/red delta indicators
- Historical portfolio value chart (line/area chart, Recharts)
- Token balances table: icon, name, amount, USD value, % change
- LP position cards: protocol logo, token pair, in-range/out-of-range badge, fees earned, APR, emissions (AERO, VELO, RAY)
- Tracked wallets sidebar: add/remove addresses, label wallets, select active wallet
- Each position card links to a detail page

### Position Detail (/dashboard/positions/[nftTokenId])

- Position header with token pair and protocol
- 4-column KPI grid: position value, total P&L, estimated APR, rewards earned
- Price range chart visualization: horizontal bar showing current price within tick bounds, in-range/out-of-range status
- Entry vs current comparison table (token amounts, prices, cost basis)
- P&L breakdown with visual bar chart
- Impermanent loss calculation
- Hold-vs-LP strategy comparison
- Position metadata footer (entry date, tick range, pool address with block explorer link)

### Pool Explorer (/pools)

- Search bar + filters (protocol, chain, token pair, TVL range, volume, APR)
- Sortable data table: pair, protocol, chain, TVL, 24h volume, 7d fees, APR
- Filter facets sidebar

### Market Data (/market)

- Global crypto stats (total market cap, 24h volume, BTC dominance)
- Trending coins list
- Market sentiment gauge
- Token categories
- Coin detail pages (/market/[coinId]) with price charts and metadata

### Protocols (/protocols)

- Protocol directory grid with category tabs (DEX, Lending, Yield, Liquid Staking, Bridges, Derivatives)
- Search by protocol name
- Stats row: total protocols, chains covered, tracked count
- Protocol cards: name, category badge, supported chains, risk level (low/medium/high), audit status & auditor names, "Supported by LiquidArc" badge for integrated protocols
- Protocol detail pages (/protocols/[slug])

### LP Simulator (/simulator)

- Model hypothetical LP positions
- Inputs: token pair, price range, fee tier, deposit amount, time horizon
- Outputs: projected fees, impermanent loss, net return

### Knowledge Hub (/knowledge)

- Educational articles organized by topic and subtopic
- Topic navigation sidebar
- Article pages with structured content (/knowledge/[topic]/[subtopic])

### Auth Pages

- Login (/login) — email + password
- Register (/register) — email + password with validation
- Forgot password (/forgot-password) — email submission + success confirmation
- Reset password (/reset-password) — token validation + new password form
- Verify email (/verify-email) — token-based async verification

### Settings & Billing

- Account settings (/settings) — email, verification status, current plan overview
- Plans & billing (/settings/billing) — three tiers:
  - **Free** ($0) — 2 wallets, Base chain only
  - **Pro** ($19/mo) — 10 wallets, all chains
  - **Enterprise** ($49/mo) — 50 wallets, webhooks, API access

## Navigation

- **Top navbar:** Logo left, nav links center, sign-in button right
- **Primary nav** (icon + label, always visible): Pools, Portfolio
- **Secondary nav** (text-only on desktop, "More" dropdown on mobile): Market, Protocols, Simulator, Learn
- **Route progress indicator** on page transitions (thin animated bar)
- **Sidebar layout** on interior pages (dashboard, defi, pools) with collapsible panel

## Design Language

- **Theme:** Dark mode only, deep navy background (`#030b14`)
- **Accent:** Teal/cyan (`#00e5c4`, aliased as `arc-400`) — CTAs, active states, glows, scrollbar
- **Surfaces:** `#060e1f` (sidebar/elevated cards), `#0b1629` (card hover), `#0c1525` (cards)
- **Card chrome:** Glass-morphism with `rgba(255,255,255,0.05)` borders on dark surfaces
- **Status colors:** Green `#34d399` for gains, Red `#f87171` for losses (with `0.10` opacity muted variants)
- **Typography:**
  - Syne (700/800) — bold headings, hero text
  - Geist Sans (100–900) — body text, UI labels
  - Geist Mono (100–900) — wallet addresses, numbers, prices, stats
- **Text hierarchy:** Primary `#f1f5f9`, Secondary `#94a3b8`, Muted `#64748b`, Dim `#475569`
- **Effects:** Subtle radial glow around accent elements, thin 5px teal scrollbar, smooth `0.2s ease-out` transitions on all interactive elements
- **Feel:** Premium fintech — clean, data-dense but not cluttered, institutional-grade aesthetic

## Supported Chains

Base, Optimism, Ethereum, Arbitrum, Solana

## Supported Protocols

Aerodrome (Base), Velodrome (Optimism), Uniswap V3 (Ethereum, Arbitrum), Orca (Solana), Raydium (Solana), Meteora (Solana)

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **viem** — EVM on-chain reads (Base, Optimism, Arbitrum, Ethereum)
- **@solana/web3.js + @solana/spl-token** — Solana wallet & token reads
- **PostgreSQL 16 + Prisma 5** — persistence, snapshots, user data
- **TailwindCSS** — utility-first styling
- **Recharts** — portfolio charts, TVL charts, data visualization
- **CoinGecko + Jupiter + DexScreener** — price feeds
- **DeFiLlama** — TVL, protocol data, DeFi overview
- **iron-session** — encrypted cookie-based session auth
- **Resend** — transactional email (verification, password reset)
- **Sentry** — error tracking
- **Vercel Analytics** — page view analytics
- **Docker** — multi-stage production builds

## Key UI Components

- **Sign-in button** — session auth dropdown with email, tier badge, settings link, sign-out
- **Wallet panel** — add/remove tracked addresses (EVM 0x... or Solana), labels, network legend
- **Data tables** — sortable columns, search/filter, loading skeletons
- **Line/area charts** — historical portfolio value, TVL timeseries (Recharts)
- **LP range visualization bars** — tick bounds with current price cursor, in-range/out-of-range indicator
- **Stat cards** — icon + value + delta (green/red), loading skeleton states
- **Protocol logo badges** — protocol name with chain indicator
- **Chain selector pills** — horizontal scrollable pill bar with active state
- **KPI grids** — 3–4 column metric displays with labels and formatted values
- **Loading skeletons** — pulse-animated placeholders matching final layout dimensions
- **Inline error states** — red-tinted banners with contextual error messages
