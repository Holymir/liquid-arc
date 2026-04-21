/**
 * PATCH  /api/alerts/[id]  — toggle active/inactive
 * DELETE /api/alerts/[id]  — delete alert
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  // Only allow toggling isActive
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
  if (isActive === undefined) {
    return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
  }

  const alert = await prisma.alert.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({ alert: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const alert = await prisma.alert.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
