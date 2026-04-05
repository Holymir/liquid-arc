/**
 * DELETE /api/v1/api-keys/:id — revoke an API key
 * PATCH  /api/v1/api-keys/:id — rename an API key
 *
 * Auth: cookie session (owner only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await prisma.apiKey.findUnique({ where: { id }, select: { userId: true } });
  if (!key || key.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await prisma.apiKey.findUnique({ where: { id }, select: { userId: true } });
  if (!key || key.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : undefined;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { name },
    select: { id: true, keyPrefix: true, name: true, isActive: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json(updated);
}
