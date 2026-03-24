import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

const createStrategySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  pair: z.string().trim().min(1),
  protocol: z.string().trim().min(1),
  chainId: z.string().trim().min(1),
  investment: z.number().positive("Investment must be positive"),
  priceLower: z.number().positive("Price lower must be positive"),
  priceUpper: z.number().positive("Price upper must be positive"),
  duration: z.number().int().positive("Duration must be positive"),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  projectedApr: z.number().optional(),
  projectedFees: z.number().optional(),
  projectedIL: z.number().optional(),
  netResult: z.number().optional(),
  strategyConfig: z.record(z.unknown()).optional(),
});

// GET /api/strategies — list saved strategies for current user
export async function GET() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategies = await prisma.savedStrategy.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ strategies });
}

// POST /api/strategies — save a new strategy
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const parsed = createStrategySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  if (data.priceUpper <= data.priceLower) {
    return NextResponse.json(
      { error: "Price upper must be greater than price lower" },
      { status: 400 }
    );
  }

  const strategy = await prisma.savedStrategy.create({
    data: {
      userId: session.userId,
      title: data.title,
      pair: data.pair,
      protocol: data.protocol,
      chainId: data.chainId,
      investment: data.investment,
      priceLower: data.priceLower,
      priceUpper: data.priceUpper,
      duration: data.duration,
      riskLevel: data.riskLevel,
      projectedApr: data.projectedApr ?? null,
      projectedFees: data.projectedFees ?? null,
      projectedIL: data.projectedIL ?? null,
      netResult: data.netResult ?? null,
      strategyConfig: (data.strategyConfig as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });

  return NextResponse.json({ strategy }, { status: 201 });
}
