import type { PortfolioResponse, TokenBalanceData, LPPositionData } from "@/types";
import { getChainAdapter } from "@/lib/chain/factory";
import { pricingService } from "@/lib/pricing/service";
import { aerodromeAdapter } from "@/lib/defi/aerodrome/adapter";
import { DEFAULT_TOKEN_ADDRESSES, NATIVE_TOKEN_ADDRESS } from "@/lib/chain/base/tokens";
import { prisma } from "@/lib/db/prisma";
import { formatUnits } from "viem";

export async function getPortfolio(
  address: string,
  chainId: string
): Promise<PortfolioResponse> {
  const adapter = getChainAdapter(chainId);
  const normalizedAddress = address.toLowerCase();

  // 1. Fetch native balance + ERC20 token balances in parallel with LP positions
  const [nativeBalance, tokenBalances, lpPositions] = await Promise.all([
    adapter.getNativeBalance(address),
    adapter.getTokenBalances(address, DEFAULT_TOKEN_ADDRESSES),
    chainId === "base" ? aerodromeAdapter.getLPPositions(address) : Promise.resolve([]),
  ]);

  // 2. Collect all token addresses that need pricing
  const allTokenAddresses = [
    ...tokenBalances.map((t) => t.tokenAddress),
    ...lpPositions.flatMap((p) => [p.token0Address, p.token1Address]),
  ];

  // 3. Fetch prices
  const prices = await pricingService.getPrices(chainId, allTokenAddresses);

  // 4. Build native balance token entry
  const nativeEntry: TokenBalanceData = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    decimals: 18,
    balance: nativeBalance,
    formattedBalance: formatUnits(nativeBalance, 18),
    usdValue: (prices.get("0x4200000000000000000000000000000000000006") ?? 0) *
      parseFloat(formatUnits(nativeBalance, 18)),
  };

  // 5. Enrich token balances with USD values
  const enrichedTokens: TokenBalanceData[] = [
    nativeEntry,
    ...tokenBalances.map((t) => ({
      ...t,
      usdValue: (prices.get(t.tokenAddress.toLowerCase()) ?? 0) *
        parseFloat(t.formattedBalance),
    })),
  ].filter((t) => parseFloat(t.formattedBalance) > 0);

  // 6. Enrich LP positions with USD values
  const enrichedLPs: LPPositionData[] = lpPositions.map((lp) => {
    const price0 = prices.get(lp.token0Address.toLowerCase()) ?? 0;
    const price1 = prices.get(lp.token1Address.toLowerCase()) ?? 0;
    const usdValue =
      (lp.token0Amount ?? 0) * price0 + (lp.token1Amount ?? 0) * price1;
    return { ...lp, usdValue };
  });

  // 7. Calculate total USD value
  const tokenTotal = enrichedTokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  const lpTotal = enrichedLPs.reduce((sum, lp) => sum + (lp.usdValue ?? 0), 0);
  const totalUsdValue = tokenTotal + lpTotal;

  // 8. Upsert wallet in DB
  const wallet = await prisma.wallet.upsert({
    where: { address_chainId: { address: normalizedAddress, chainId } },
    update: { isActive: true },
    create: {
      address: normalizedAddress,
      chainId,
      chainType: chainId === "solana" ? "svm" : "evm",
    },
  });

  // 9. Upsert token balances (fire-and-forget, don't block the response)
  void Promise.all(
    enrichedTokens.map((t) =>
      prisma.tokenBalance.upsert({
        where: {
          id: `${wallet.id}:${t.tokenAddress}`,
        },
        update: {
          balance: t.balance.toString(),
          usdValue: t.usdValue,
          lastUpdated: new Date(),
        },
        create: {
          id: `${wallet.id}:${t.tokenAddress}`,
          walletId: wallet.id,
          tokenAddress: t.tokenAddress,
          symbol: t.symbol,
          decimals: t.decimals,
          balance: t.balance.toString(),
          usdValue: t.usdValue,
        },
      }).catch((err: unknown) => {
        console.warn("[portfolio] tokenBalance upsert failed:", err);
      })
    )
  );

  // 10. Serialize BigInts to strings for JSON response
  return {
    walletAddress: address,
    chainId,
    totalUsdValue,
    tokenBalances: enrichedTokens.map((t) => ({
      ...t,
      balance: t.balance.toString(),
    })),
    lpPositions: enrichedLPs.map((lp) => ({
      ...lp,
      liquidity: lp.liquidity.toString(),
    })),
    lastUpdated: new Date().toISOString(),
  };
}
