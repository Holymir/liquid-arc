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

    // Compute total TVL
    const totalTvl = chain
      ? filteredProtocols.reduce((sum, p) => sum + p.tvl, 0)
      : historicalTvl.length > 0
        ? historicalTvl[historicalTvl.length - 1].tvl
        : protocols.reduce((sum, p) => sum + p.tvl, 0);

    // Compute weighted 24h change
    let tvlChange24h = 0;
    if (filteredProtocols.length > 0) {
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
