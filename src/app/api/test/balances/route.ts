// Test route for Base chain adapter — GET /api/test/balances?address=0x...
import { NextRequest, NextResponse } from "next/server";
import { getChainAdapter } from "@/lib/chain/factory";
import { DEFAULT_TOKEN_ADDRESSES } from "@/lib/chain/base/tokens";
import { formatUnits } from "viem";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "?address=0x... required" }, { status: 400 });
  }

  const adapter = getChainAdapter("base");

  const [nativeBalance, tokenBalances] = await Promise.all([
    adapter.getNativeBalance(address),
    adapter.getTokenBalances(address, DEFAULT_TOKEN_ADDRESSES),
  ]);

  return NextResponse.json({
    address,
    chain: "base",
    nativeETH: formatUnits(nativeBalance, 18),
    tokens: tokenBalances.map((t) => ({
      symbol: t.symbol,
      balance: t.formattedBalance,
      address: t.tokenAddress,
    })),
  });
}
