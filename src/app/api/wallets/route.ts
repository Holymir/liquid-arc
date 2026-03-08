import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

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

  const body = await request.json();
  const { address, label } = body;

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const normalized = address.toLowerCase();

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

  // Only deactivate wallets owned by this user
  await prisma.wallet.updateMany({
    where: { address: address.toLowerCase(), userId: session.userId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
