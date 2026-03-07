import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { chainIdToType } from "@/lib/chain/utils";

export async function GET() {
  const wallets = await prisma.wallet.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ wallets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { address, chainId, label } = body;

  if (!address || !chainId) {
    return NextResponse.json(
      { error: "address and chainId are required" },
      { status: 400 }
    );
  }

  const wallet = await prisma.wallet.upsert({
    where: { address_chainId: { address: address.toLowerCase(), chainId } },
    update: { isActive: true, label: label ?? undefined },
    create: {
      address: address.toLowerCase(),
      chainId,
      chainType: chainIdToType(chainId),
      label: label ?? null,
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}
