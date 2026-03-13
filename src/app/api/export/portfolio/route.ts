import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getTierLimits } from "@/lib/auth/tier";

export async function GET(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limits = getTierLimits(user.tier);
  if (!limits.exportEnabled) {
    return NextResponse.json(
      { error: "Export is available on Pro and Enterprise plans" },
      { status: 403 }
    );
  }

  const walletId = req.nextUrl.searchParams.get("walletId");
  if (!walletId) {
    return NextResponse.json({ error: "walletId is required" }, { status: 400 });
  }

  // Verify wallet ownership
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId: session.userId },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { walletId },
    orderBy: { snapshotAt: "asc" },
  });

  // Build CSV
  const header = "Date,Total USD Value";
  const rows = snapshots.map((s) =>
    `${s.snapshotAt.toISOString()},${s.totalUsdValue.toFixed(2)}`
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="portfolio-${wallet.address.slice(0, 8)}.csv"`,
    },
  });
}
