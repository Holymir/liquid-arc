# LiquidArc — Full Code Review & Subscription Tier Audit

> Reviewed by: Arc Dev (Senior Developer, LiquidArc)  
> Date: 2026-04-04  
> Branch: `feat/stripe-billing`  
> Scope: All API routes, lib/, middleware, backend, Prisma schema

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [High Severity Issues](#2-high-severity-issues)
3. [Medium Severity Issues](#3-medium-severity-issues)
4. [Low Severity Issues](#4-low-severity-issues)
5. [Subscription Tier Audit](#5-subscription-tier-audit)
6. [Tier Gating Recommendations](#6-tier-gating-recommendations)

---

## 1. Critical Issues

### 1.1 — Real Stripe API Keys in `.env.local`

**File:** `.env.local`  
**Severity:** CRITICAL

```
STRIPE_SECRET_KEY=sk_test_51TIPTz...  (real test key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TIPTz...  (real test key)
```

The `.env.local` file contains actual Stripe test API keys (not placeholders). While `.gitignore` correctly excludes `.env*.local` from version control, these keys exist on disk in the workspace. If the repo is ever accidentally committed or the machine is compromised:
- `STRIPE_SECRET_KEY` can be used to create customers, charges, cancel subscriptions
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is semi-public but shouldn't appear in codebases

**Fix:** Rotate both keys immediately at dashboard.stripe.com. Never store real keys (even test keys) in committed files. Use a secrets manager or `.env` that's always gitignored.

---

### 1.2 — `SESSION_SECRET` Is a Placeholder

**File:** `.env.local`, `src/lib/auth/session.ts`  
**Severity:** CRITICAL

```
SESSION_SECRET=placeholder-secret-at-least-32-characters-long
```

IronSession uses this secret to sign/encrypt session cookies. With a known placeholder, anyone can forge valid session cookies:
1. Craft `{ userId: "any-user-id", isLoggedIn: true }`
2. Encrypt with the known key
3. Submit as a valid session cookie → full account takeover

**Fix:** Generate a strong random secret (`openssl rand -base64 32`) for every deployment environment. Add validation at startup:
```typescript
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.startsWith("placeholder")) {
  throw new Error("SESSION_SECRET must be set to a strong random value");
}
```

---

### 1.3 — In-Memory Rate Limiter Ineffective in Serverless

**File:** `src/lib/rate-limit.ts`, `src/middleware.ts`  
**Severity:** CRITICAL (security effectiveness)

```typescript
// rate-limit.ts
const store = new Map<string, RateLimitEntry>();
```

Vercel serverless functions don't share memory between invocations. Each cold start gets a fresh `Map`. This means:
- Auth rate limit (5 req/min) is bypassed by any attacker using the default Vercel concurrency
- Brute-force login attacks are completely unprotected in production
- The code has a comment acknowledging this: *"For production at scale, swap with @upstash/ratelimit + Redis"*

**Fix:** Implement Redis-backed rate limiting before launching paid tiers. @upstash/ratelimit is a drop-in replacement with the same API.

---

### 1.4 — In-Memory Cache Doesn't Persist Across Serverless Invocations

**File:** `src/lib/cache/index.ts`, `src/lib/pricing/coingecko.ts`, `src/lib/market/coingecko-market.ts`  
**Severity:** CRITICAL (reliability / API abuse)

Three separate in-memory caches are implemented across the codebase. In a serverless environment:
- Every cold-start hits CoinGecko's API fresh
- Under load, hundreds of concurrent requests will hammer CoinGecko simultaneously
- The free CoinGecko tier has very strict rate limits; this will cause widespread 429s in production
- The tier-based `cacheSeconds` in `TIER_LIMITS` (5min/1min/15sec) **can never actually be enforced** with in-memory cache since state doesn't persist

**Fix:** Use Upstash Redis or Vercel KV for caching. This also enables tier-based TTLs.

---

## 2. High Severity Issues

### 2.1 — `/api/market/*` Routes Completely Unprotected

**File:** `src/middleware.ts` (matcher config), `src/app/api/market/`  
**Severity:** HIGH (security + availability)

The middleware `config.matcher` does NOT include `/api/market/:path*`:

```typescript
// middleware.ts - config.matcher (lines 78-93)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/wallets/:path*",
    "/api/portfolio/:path*",
    "/api/prices/:path*",
    // ❌ /api/market/* is MISSING
    "/api/auth/...",
    "/api/pools/:path*",
    "/knowledge/:path*",
  ],
};
```

All market routes (`/api/market`, `/api/market/global`, `/api/market/sentiment`, `/api/market/trending`, `/api/market/categories`, `/api/market/[coinId]`) bypass middleware entirely — no rate limiting, no auth enforcement. These endpoints call CoinGecko on every request.

An attacker can hammer these endpoints to exhaust the CoinGecko API quota for all users.

**Fix:** Add `/api/market/:path*` to the matcher and apply the `public` rate limit.

---

### 2.2 — Stripe Checkout/Portal Routes Not Rate-Limited

**File:** `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`  
**Severity:** HIGH

These routes are not in the middleware matcher. They use `requireAuth()` for authentication but have zero rate limiting. A logged-in user could:
- Spam `/api/stripe/checkout` to create hundreds of Stripe checkout sessions
- Each session creation calls the Stripe API and creates customer records

Stripe has its own rate limits, but hitting them would prevent legitimate users from subscribing.

**Fix:** Add `/api/stripe/:path*` to the matcher (while keeping the public passthrough for `/api/stripe` — currently those routes do their own auth), and apply `api:${userId}` rate limit.

---

### 2.3 — N+1 Queries in Ingestion (Pool Day Data)

**File:** `src/backend/ingestion.ts` (line ~150), `src/lib/pools/ingestion.ts` (line ~130)  
**Severity:** HIGH (performance)

```typescript
// backend/ingestion.ts ~line 150
for (const [poolAddress, dayData] of poolDayDataMap) {
  const pool = await prisma.pool.findUnique({  // ← One DB query per pool!
    where: { chainId_poolAddress: { chainId: adapter.chainId, poolAddress } },
    select: { id: true },
  });
  // ...
}
```

For 200 pools, this is 200 sequential `findUnique` calls. The ingestion also upserts pools one-by-one in a loop:

```typescript
for (const pool of validPools) {
  await prisma.pool.upsert({...}); // ← Another 200 sequential calls
```

Total: ~400 sequential DB round-trips per protocol per ingestion run.

**Fix:** Batch the pool lookups with `findMany` and `in:` clause. Use `createMany` with `skipDuplicates` where possible, or batch upserts.

---

### 2.4 — Duplicate Ingestion Code (Divergence Risk)

**File:** `src/lib/pools/ingestion.ts` vs `src/backend/ingestion.ts`  
**Severity:** HIGH (maintenance)

The Vercel ingestion and Railway backend ingestion contain almost entirely duplicated code:
- `computePoolMetrics()` — duplicated
- `computeVolatilityMetrics()`, `dailyReturns()`, `annualizedVolatility()`, `pearsonCorrelation()` — all duplicated
- `runPhase1()`, `runPhase2()` — similar logic, diverged slightly

The backend version (`src/backend/ingestion.ts`) doesn't include `fetchPoolEmissions()` calls that the Vercel version has (line ~57 in `src/lib/pools/ingestion.ts`). This means the backend ingestion silently omits emissions APR data.

**Bug:** Railway backend ingestion **never updates `emissionsApr` field** — all pools will show `null` for emissions APR unless the Vercel endpoint is used.

**Fix:** Extract shared logic into `src/lib/pools/ingestion-core.ts` and import from both. Fix the emissions data omission in the backend ingestion.

---

### 2.5 — Missing Indexes on Auth Lookup Fields

**File:** `prisma/schema.prisma`  
**Severity:** HIGH (performance at scale)

```prisma
model User {
  resetToken        String?  @map("reset_token")     // ← No index
  verificationToken String?  @map("verification_token") // ← No index
  stripeCustomerId  String?  @unique @map("stripe_customer_id")  // ✅ has unique
```

`resetToken` and `verificationToken` are used in `findFirst` queries on every password reset and email verification:

```typescript
// reset-password/route.ts
const user = await prisma.user.findFirst({
  where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
});

// verify-email/route.ts  
const user = await prisma.user.findFirst({
  where: { verificationToken: token },
});
```

Without indexes, these are full table scans on every click. At scale, this will be very slow.

**Fix:**
```prisma
resetToken        String?  @map("reset_token")  @unique
verificationToken String?  @map("verification_token")  @unique
```

---

### 2.6 — Portfolio History Query Has No Row Limit

**File:** `src/app/api/portfolio/[address]/positions/[nftTokenId]/history/route.ts`  
**Severity:** HIGH (DoS / performance)

```typescript
const PERIOD_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
  all: 999999,  // ← ~114 years
};

const snapshots = await prisma.positionSnapshot.findMany({
  where: {
    walletId: wallet.id,
    nftTokenId,
    snapshotAt: { gte: since },
  },
  // ❌ No `take` limit
  orderBy: { snapshotAt: "asc" },
```

`period=all` will scan every snapshot ever recorded for a position with no limit. Snapshots are created every ~15 minutes. An active user with 50 positions over a year = 2,628,000 rows. This query will OOM or timeout.

**Fix:** Add `take: 2000` and implement server-side downsampling for large datasets.

---

## 3. Medium Severity Issues

### 3.1 — Tier Enforcement: Cache TTL Never Applied

**File:** `src/lib/auth/tier.ts`, `src/lib/pricing/service.ts`, `src/app/api/portfolio/[address]/route.ts`  
**Severity:** MEDIUM

The `TIER_LIMITS` defines cache seconds per tier:
```typescript
// tier.ts
free: { cacheSeconds: 300 },  // 5 min
pro:  { cacheSeconds: 60 },   // 1 min
enterprise: { cacheSeconds: 15 }, // 15 sec
```

But nowhere in the codebase is `cacheSeconds` ever read or used. The pricing service hardcodes `PRICE_CACHE_TTL = 30` seconds for everyone. Portfolio data has no server-side caching at all — it re-fetches from RPC on every request. The tier differentiation on refresh rate is completely illusory.

**Fix:** Read the user's tier in the portfolio route and pass `cacheSeconds` to the pricing service and portfolio fetcher.

---

### 3.2 — Alert Limit Defined But Never Enforced

**File:** `src/lib/auth/tier.ts`, prisma schema  
**Severity:** MEDIUM

`TIER_LIMITS` defines `maxAlerts: 0/10/100` but there are no alert API routes. The `Alert` and `AlertHistory` models exist in the schema, and alerts are associated with users, but:
- No `POST /api/alerts` route exists
- No enforcement of `maxAlerts` anywhere
- Middleware matcher includes `/api/alerts/:path*` but the route doesn't exist

This is likely a planned feature, but the limit definition suggests it was expected to be enforced now.

**Fix:** Document as "in development" or remove the limit from `TIER_LIMITS` until the alerts feature is built.

---

### 3.3 — `calculatePnL` Logic Bug: Wrong "Previous Value" Baseline

**File:** `src/lib/portfolio/pnl.ts` (lines 17-28)  
**Severity:** MEDIUM (incorrect data shown to users)

```typescript
const [latest, oldest] = await Promise.all([
  prisma.portfolioSnapshot.findFirst({
    where: { walletId },
    orderBy: { snapshotAt: "desc" },
  }),
  prisma.portfolioSnapshot.findFirst({
    where: { walletId, snapshotAt: { gte: since } },  // ← BUG
    orderBy: { snapshotAt: "asc" },
  }),
]);
```

The "oldest" query finds the first snapshot **within** the window (e.g., within the last 7 days), not the snapshot **at the start** of the window. 

Scenario: User hasn't been active for 6 days. They check in today. The "oldest" snapshot in the 7d window is from today (5 minutes ago). P&L shows $0 change instead of the actual 7d change.

**Fix:** Query the most recent snapshot **before** `since`, not the oldest after it:
```typescript
prisma.portfolioSnapshot.findFirst({
  where: { walletId, snapshotAt: { lte: since } },
  orderBy: { snapshotAt: "desc" },
}),
```

---

### 3.4 — Wallet Deduplication Logic Is Incorrect

**File:** `src/app/api/wallets/route.ts` (lines 22-32)  
**Severity:** MEDIUM (data correctness)

```typescript
for (const w of wallets) {
  const key = w.chainType === "svm" ? w.address : w.address.toLowerCase();
  const existing = byAddress.get(key);
  if (!existing || w.chainId === "base") {  // ← Always prefer "base" chain
    byAddress.set(key, {
      ...w,
      label: w.label || existing?.label || null,
    });
  }
}
```

The deduplication always prefers the `base` chain wallet over any other EVM chain. This is hardcoded and wrong for multi-chain users (Ethereum, Arbitrum, Optimism, etc.). If the same address exists on multiple chains, only the Base version is shown regardless of intent.

Also, this deduplication happens at the API response level, not storage level. Users can still have wallets on multiple chains in the DB, but the GET endpoint silently hides all non-Base wallets sharing the same address.

**Fix:** Remove deduplication from the GET response, or do it properly by showing all chain-specific wallets as separate entries.

---

### 3.5 — `TokenBalance` ID Collision Risk

**File:** `src/lib/portfolio/service.ts` (lines ~220-240)  
**Severity:** MEDIUM

```typescript
prisma.tokenBalance.upsert({
  where: { id: `${wallet.id}:${t.tokenAddress}` },  // ← Composite string, not UUID
  update: {...},
  create: {
    id: `${wallet.id}:${t.tokenAddress}`,  // ← Manually set ID
```

The schema defines `id String @id @default(uuid())`, but the code bypasses the UUID generation and uses a composite string. Issues:
1. The schema convention (UUID) is violated
2. If `wallet.id` or `tokenAddress` ever contains special characters, this could produce unexpected IDs
3. No DB-level unique constraint enforces the `walletId + tokenAddress` combination independently; only the hand-crafted `id` provides uniqueness

**Fix:** Add a proper `@@unique([walletId, tokenAddress])` constraint to the schema and use `upsert` with that constraint.

---

### 3.6 — `stripe.ts` Throws at Module Import Time

**File:** `src/lib/stripe.ts` (line 3)  
**Severity:** MEDIUM

```typescript
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}
```

This `throw` at module import time means **any file that imports from `@/lib/stripe`** — even transitively — will crash the entire Next.js application if `STRIPE_SECRET_KEY` is not set. This makes it impossible to run the app in environments without Stripe configured (e.g., CI, dev environments for frontend-only work).

**Fix:** Lazy-initialize the Stripe client inside functions, or use a getter pattern:
```typescript
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {...});
  return _stripe;
}
```

---

### 3.7 — Race Condition in Portfolio Snapshot Throttle

**File:** `src/lib/portfolio/snapshot.ts` (lines 8-15)  
**Severity:** MEDIUM

```typescript
const recent = await prisma.portfolioSnapshot.findFirst({
  where: { walletId, snapshotAt: { gte: new Date(Date.now() - 15 * 60_000) } },
  select: { id: true },
});
if (recent) return;
// ... create snapshot
```

This is a classic TOCTOU (time-of-check-time-of-use) race condition. Two concurrent portfolio requests for the same wallet will both pass the "no recent snapshot" check simultaneously and both call `prisma.portfolioSnapshot.create()`. The result is duplicate snapshots in the DB.

At scale (many users with auto-refresh dashboards), this creates duplicate entries that inflate snapshot counts and skew P&L calculations.

**Fix:** Use a database-level unique constraint on `(walletId, snapshotAt)` with a `upsert` / conflict-resolution strategy, or use a distributed lock.

---

### 3.8 — `GET /api/internal/ingest` Duplicates POST

**File:** `src/app/api/internal/ingest/route.ts` (line 56)  
**Severity:** MEDIUM

```typescript
export async function GET(request: NextRequest) {
  return POST(request);
}
```

A GET handler that triggers a POST action (pool ingestion) violates HTTP semantics. GET requests are expected to be idempotent and safe. Monitoring tools, uptime checkers, and browser prefetch can all trigger GET requests inadvertently, potentially triggering an ingestion run.

**Fix:** Remove the GET handler. Ingestion should only be triggered via POST.

---

### 3.9 — `period=all` Not Handled in `calculatePnL`

**File:** `src/app/api/portfolio/[address]/history/route.ts` (line 55)  
**Severity:** MEDIUM

```typescript
const pnlPeriod = isAll ? "30d" : period;
// ...
calculatePnL(wallet.id, pnlPeriod as "24h" | "7d" | "30d"),
```

When `period=all` is requested, `calculatePnL` is called with `"30d"` as a silent fallback. The user expects "all time" P&L but gets 30-day P&L. No error is returned, and the discrepancy isn't documented in the response.

**Fix:** Implement an "all time" P&L mode in `calculatePnL`, or clearly document/label the fallback in the response.

---

## 4. Low Severity Issues

### 4.1 — Dead Code: Deprecated SIWE Routes

**File:** `src/app/api/auth/nonce/route.ts`, `src/app/api/auth/verify/route.ts`  
**Severity:** LOW

Both routes return 410 Gone. They're dead code. They add noise to the codebase and unnecessary route handlers.

**Fix:** Delete both files.

---

### 4.2 — `RESEND_API_KEY` Missing from `.env.example`

**File:** `.env.example`, `src/lib/email/service.ts`  
**Severity:** LOW

The email service uses `process.env.RESEND_API_KEY` and `process.env.EMAIL_FROM`, but neither is documented in `.env.example`. New developers won't know to set these up.

**Fix:** Add to `.env.example`:
```
RESEND_API_KEY=re_...         # Get from resend.com
EMAIL_FROM=LiquidArc <noreply@yourdomain.com>
BACKEND_URL=http://localhost:3001  # Railway backend URL
INGEST_ON_STARTUP=false
BACKEND_PORT=3001
```

---

### 4.3 — Hardcoded 5% Lending APY in Simulator

**File:** `src/lib/simulator/engine.ts` (line 2)  
**Severity:** LOW

```typescript
const LENDING_APY = 0.05; // 5% average lending rate
```

The simulator compares LP performance against "lending at 5% APY". This is a static value that doesn't reflect real lending rates (which fluctuate significantly in DeFi). Users might make decisions based on stale comparisons.

**Fix:** Accept lending APY as an input parameter in `SimulatorInput`, defaulting to `0.05`.

---

### 4.4 — Inconsistent Token Address Normalization

**File:** Multiple files  
**Severity:** LOW

Token address normalization is done inconsistently:
- `src/app/api/wallets/route.ts` DELETE: `const isSolana = !address.startsWith("0x")` — assumes anything non-`0x` is Solana
- `src/lib/validation/schemas.ts`: Uses regex to distinguish EVM vs Solana
- `src/lib/portfolio/service.ts`: Uses `chainId === "solana"` check

The heuristic `!address.startsWith("0x")` is fragile — future chains (Cosmos, NEAR, etc.) would be misidentified as Solana.

**Fix:** Centralize chain detection in `detectChainType` from `validation/schemas.ts` and use it consistently everywhere.

---

### 4.5 — `any` Types and Loose Type Casts

**File:** `src/lib/market/coingecko-market.ts`  
**Severity:** LOW

Extensive use of `as Record<string, unknown>` casts throughout the CoinGecko response parsing (e.g., lines 90, 105, 120, 185, etc.). While not technically `any`, these casts disable TypeScript's type checking for those expressions. If the CoinGecko API changes a field structure, the casts will silently return `undefined` or `NaN` with no type error.

**Fix:** Define proper Zod schemas for CoinGecko API responses and parse/validate them at the boundary.

---

### 4.6 — Missing Error Boundary for Stripe Module Load

**File:** `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`  
**Severity:** LOW

Both routes catch `err.message === "Unauthorized"` to distinguish auth errors from Stripe errors:

```typescript
} catch (err) {
  if (err instanceof Error && err.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```

This is fragile. If `requireAuth()` ever changes its error message, the auth error handling silently breaks and returns 500 instead of 401.

**Fix:** Create a typed `UnauthorizedError` class and `instanceof` check against it:
```typescript
class UnauthorizedError extends Error { name = "UnauthorizedError" }
```

---

### 4.7 — `emissionsApr` Missing from Pool Detail Response

**File:** `src/app/api/pools/[chainId]/[poolAddress]/route.ts`  
**Severity:** LOW

The pool listing (`GET /api/pools`) correctly returns `emissionsApr` but the pool detail route omits it from the response object. Users viewing a specific pool's detail page won't see emissions APR data even though it's in the DB.

**Fix:** Add `emissionsApr: pool.emissionsApr` to the detail response.

---

### 4.8 — `INGEST_SECRET` Not Validated at Startup

**File:** `src/backend/server.ts`  
**Severity:** LOW

The backend server doesn't validate that `INGEST_SECRET` is set. If omitted, `isAuthorized()` returns `false` for all requests (correct behavior), but the `/ingest` endpoint silently refuses all calls with 401, and the cron scheduler still runs and can trigger ingestion internally via `runNow()` — meaning internal ingestion works but external triggers don't, with no warning.

**Fix:** Log a clear warning at startup if `INGEST_SECRET` is not set.

---

## 5. Subscription Tier Audit

### What the Schema Defines

```typescript
// src/lib/auth/tier.ts
export const TIER_LIMITS = {
  free:       { maxWallets: 2,  maxAlerts: 0,   cacheSeconds: 300, exportEnabled: false },
  pro:        { maxWallets: 10, maxAlerts: 10,  cacheSeconds: 60,  exportEnabled: true  },
  enterprise: { maxWallets: 50, maxAlerts: 100, cacheSeconds: 15,  exportEnabled: true  },
};
```

### What Is Actually Enforced in Code

| Feature | Defined In | Enforced? | Where |
|---------|-----------|-----------|-------|
| Wallet limit | `TIER_LIMITS.maxWallets` | ✅ **Yes** | `POST /api/wallets` (line ~55) |
| Alert limit | `TIER_LIMITS.maxAlerts` | ❌ **No** | No alerts API exists |
| Cache TTL by tier | `TIER_LIMITS.cacheSeconds` | ❌ **No** | Never read anywhere |
| Export | `TIER_LIMITS.exportEnabled` | ❌ **No** | No export API exists |
| Portfolio history depth | Not defined | ❌ **No gating** | All tiers get same history |
| Market data | Not defined | ❌ **No gating** | Fully public |
| Pool analytics | Not defined | ❌ **No gating** | Fully public |
| Simulator | Not defined | ❌ **No gating** | Fully public |
| API rate limit | Middleware `RATE_LIMITS.api` | ✅ Partially | 30 req/min for all auth users |

### Summary

**Only 1 out of 5 defined tier features is actually enforced** (wallet count). The rest are defined but not wired up. Users on Pro/Enterprise are currently getting the same functional experience as Free users (aside from more wallet slots), which means the $15/mo and $99/mo plans don't deliver meaningful differentiation today.

---

## 6. Tier Gating Recommendations

Based on the features actually built, here's what each tier should include and what's feasible to gate:

### Free Tier (current: 2 wallets)

**Recommended gates:**
- 2 wallets ✅ (already enforced)
- Market data & public pool analytics: fully public (good for acquisition)
- LP Simulator: public (lead magnet, no auth required)
- Portfolio history: **7 days max**
- Position snapshot history: **7 days max**
- No alerts
- No export
- API rate: 30 req/min (current)

### Pro Tier ($15/mo)

**Recommended gates:**
- 10 wallets ✅ (already enforced)
- Portfolio history: **90 days**
- Position snapshot history: **90 days**
- Alerts: 10 (when built)
- Export to CSV: enabled (when built)
- Faster portfolio refresh: 60s cache (requires Redis)
- API rate: 60 req/min (2x free)

### Enterprise Tier ($99/mo)

**Recommended gates:**
- 50 wallets ✅ (already enforced)
- Portfolio history: **all time**
- Position snapshot history: **all time**
- Alerts: 100 (when built)
- Export: enabled
- Fastest refresh: 15s cache (requires Redis)
- API rate: 300 req/min (10x free)
- Priority support

### Immediate Actionable Improvements (no Redis needed)

1. **Gate portfolio history depth by tier** — Add tier check in `/api/portfolio/[address]/history` to limit `period` param:
   - Free: max `7d`
   - Pro: max `90d`  
   - Enterprise: `all`

2. **Gate position snapshot history depth** — Same check in `/api/portfolio/[address]/positions/[nftTokenId]/history`

3. **Show tier badge and upgrade prompts** in the UI when free users try to access Pro features

4. **Enforce `maxAlerts`** when building the alerts feature — the scaffold is ready in `TIER_LIMITS`

### Gating That Requires Infrastructure Changes

5. **Per-tier cache TTL** — Requires shared Redis cache (Upstash) to be effective
6. **Per-tier API rate limits** — Requires Redis-backed rate limiting (critical security fix anyway, see Issue 1.3)

---

## Quick Reference: Priority Action List

| Priority | Issue | File(s) |
|----------|-------|---------|
| 🔴 CRITICAL | Rotate Stripe API keys in `.env.local` | `.env.local` |
| 🔴 CRITICAL | Generate real `SESSION_SECRET` | `.env.local`, `session.ts` |
| 🔴 CRITICAL | Replace in-memory rate limiter with Redis | `rate-limit.ts` |
| 🔴 CRITICAL | Replace in-memory caches with Redis | `cache/index.ts`, `coingecko.ts`, `coingecko-market.ts` |
| 🟠 HIGH | Add `/api/market/*` to middleware matcher | `middleware.ts` |
| 🟠 HIGH | Rate-limit Stripe checkout/portal | `middleware.ts` |
| 🟠 HIGH | Fix N+1 queries in ingestion | `backend/ingestion.ts` |
| 🟠 HIGH | Fix emissions APR in backend ingestion | `backend/ingestion.ts` |
| 🟠 HIGH | Add indexes on `resetToken`, `verificationToken` | `schema.prisma` |
| 🟠 HIGH | Add `take` limit to history queries | position history route |
| 🟡 MEDIUM | Fix `calculatePnL` baseline snapshot logic | `pnl.ts` |
| 🟡 MEDIUM | Fix wallet deduplication logic | `wallets/route.ts` |
| 🟡 MEDIUM | Fix `stripe.ts` throw-on-import | `stripe.ts` |
| 🟡 MEDIUM | Gate portfolio history depth by tier | history routes |
| 🟡 MEDIUM | Fix duplicate ingestion code + emissions bug | ingestion files |
| 🟢 LOW | Remove dead SIWE routes | `nonce/`, `verify/` routes |
| 🟢 LOW | Add missing env vars to `.env.example` | `.env.example` |
| 🟢 LOW | Remove GET handler from ingest route | `internal/ingest/route.ts` |
| 🟢 LOW | Add `emissionsApr` to pool detail response | pool detail route |
