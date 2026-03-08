import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const wallets = await prisma.wallet.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Deduplicate by address — return one entry per address.
  // Prefer the "base" row (our primary chain) if multiple exist.
  const byAddress = new Map<string, typeof wallets[0]>();
  for (const w of wallets) {
    const key = w.address.toLowerCase();
    const existing = byAddress.get(key);
    if (!existing || w.chainId === "base") {
      byAddress.set(key, {
        ...w,
        // Use the label from whichever entry has one
        label: w.label || existing?.label || null,
      });
    }
  }

  return NextResponse.json({ wallets: [...byAddress.values()] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { address, label } = body;

  if (!address) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400 }
    );
  }

  const normalized = address.toLowerCase();

  // Create a single "base" entry as the canonical wallet record.
  // Future chains will query the same address without extra DB rows.
  const wallet = await prisma.wallet.upsert({
    where: { address_chainId: { address: normalized, chainId: "base" } },
    update: { isActive: true, label: label ?? undefined },
    create: {
      address: normalized,
      chainId: "base",
      chainType: "evm",
      label: label ?? null,
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const address = searchParams.get("address");

  if (!id && !address) {
    return NextResponse.json({ error: "id or address is required" }, { status: 400 });
  }

  if (address) {
    // Deactivate ALL entries for this address (across all chains)
    await prisma.wallet.updateMany({
      where: { address: address.toLowerCase() },
      data: { isActive: false },
    });
  } else {
    await prisma.wallet.update({
      where: { id: id! },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
