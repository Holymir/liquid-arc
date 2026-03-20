import { NextRequest, NextResponse } from "next/server";
import {
  getProtocols,
  getChains,
  getHistoricalTvl,
  getDexVolume,
  getPerpsVolume,
  getStablecoinMcap,
} from "@/lib/defi/defillama";
import type { DefiOverviewResponse } from "@/lib/defi/defillama-types";

export async function GET(request: NextRequest) {
  try {
    const chain = request.nextUrl.searchParams.get("chain") || undefined;

    const [protocols, chains, historicalTvl, dexVolume, perpsVolume, stablecoinMcap] =
      await Promise.all([
        getProtocols(),
        getChains(),
        getHistoricalTvl(chain),
        getDexVolume(),
        getPerpsVolume(),
        getStablecoinMcap(),
      ]);

    // Filter protocols by chain if specified
    const filteredProtocols = chain
      ? protocols.filter(
          (p) =>
            p.chain.toLowerCase() === chain.toLowerCase() ||
            p.chains.some((c) => c.toLowerCase() === chain.toLowerCase())
        )
      : protocols;

    // Compute total TVL — historicalTvl is already chain-specific when chain param is set
    const totalTvl = historicalTvl.length > 0
      ? historicalTvl[historicalTvl.length - 1].tvl
      : filteredProtocols.reduce((sum, p) => sum + p.tvl, 0);

    // Compute 24h change from historical data (works for both global and chain-specific)
    let tvlChange24h = 0;
    if (historicalTvl.length >= 2) {
      const latest = historicalTvl[historicalTvl.length - 1];
      const oneDayAgo = latest.date - 86400;
      let prevTvl = historicalTvl[0].tvl;
      for (const point of historicalTvl) {
        if (point.date <= oneDayAgo) prevTvl = point.tvl;
        else break;
      }
      tvlChange24h = prevTvl > 0 ? ((latest.tvl - prevTvl) / prevTvl) * 100 : 0;
    } else if (filteredProtocols.length > 0) {
      // Fallback to weighted protocol change
      let weightedSum = 0;
      let totalWeight = 0;
      for (const p of filteredProtocols) {
        if (p.change1d != null && p.tvl > 0) {
          weightedSum += p.change1d * p.tvl;
          totalWeight += p.tvl;
        }
      }
      tvlChange24h = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    const response: DefiOverviewResponse = {
      totalTvl,
      tvlChange24h,
      historicalTvl,
      protocols: filteredProtocols,
      chains,
      stablecoinMcap,
      dexVolume24h: dexVolume,
      perpsVolume24h: perpsVolume,
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch (error) {
    console.error("[api/defi/overview]", error);
    return NextResponse.json(
      { error: "Failed to fetch DeFi overview" },
      { status: 500 }
    );
  }
}
