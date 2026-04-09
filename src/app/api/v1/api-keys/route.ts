/**
 * GET  /api/v1/api-keys  — list user's API keys (no raw key returned)
 * POST /api/v1/api-keys  — create a new API key (raw key shown once)
 *
 * Auth: cookie session (user must be logged in)
 * Tier: pro or enterprise
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { checkFeatureAccess } from "@/lib/auth/tier";
import { generateRawApiKey, hashApiKey } from "@/lib/auth/api-key";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    select: { id: true, keyPrefix: true, name: true, isActive: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const access = checkFeatureAccess(user.tier, "apiAccess");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error?.message ?? "Upgrade required." }, { status: 403 });
  }

  // Limit to 5 active keys per user
  const activeCount = await prisma.apiKey.count({ where: { userId: session.userId, isActive: true } });
  if (activeCount >= 5) {
    return NextResponse.json({ error: "Maximum of 5 active API keys reached. Revoke one to continue." }, { status: 422 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "Default";

  const rawKey = generateRawApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 11); // "la_" + 8 hex chars

  const key = await prisma.apiKey.create({
    data: {
      userId: session.userId,
      keyHash,
      keyPrefix,
      name,
    },
    select: { id: true, keyPrefix: true, name: true, isActive: true, createdAt: true },
  });

  // Return the raw key once — it will never be shown again
  return NextResponse.json({ ...key, key: rawKey }, { status: 201 });
}
