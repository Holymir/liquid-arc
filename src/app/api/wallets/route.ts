import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { addWalletSchema } from "@/lib/validation/schemas";
import { getTierLimits } from "@/lib/auth/tier";

export async function GET() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Deduplicate by address
  const byAddress = new Map<string, (typeof wallets)[0]>();
  for (const w of wallets) {
    const key = w.address.toLowerCase();
    const existing = byAddress.get(key);
    if (!existing || w.chainId === "base") {
      byAddress.set(key, {
        ...w,
        label: w.label || existing?.label || null,
      });
    }
  }

  return NextResponse.json({ wallets: [...byAddress.values()] });
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const parsed = addWalletSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { address, label } = parsed.data;
  const normalized = address.toLowerCase();

  // Check tier-based wallet limit
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const limits = getTierLimits(user?.tier ?? "free");

  const currentCount = await prisma.wallet.count({
    where: { userId: session.userId, isActive: true },
  });

  if (currentCount >= limits.maxWallets) {
    return NextResponse.json(
      { error: `Wallet limit reached (${limits.maxWallets}). Upgrade your plan to add more.` },
      { status: 403 }
    );
  }

  const wallet = await prisma.wallet.upsert({
    where: { address_chainId: { address: normalized, chainId: "base" } },
    update: { isActive: true, label: label ?? undefined, userId: session.userId },
    create: {
      address: normalized,
      chainId: "base",
      chainType: "evm",
      label: label ?? null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  await prisma.wallet.updateMany({
    where: { address: address.toLowerCase(), userId: session.userId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
