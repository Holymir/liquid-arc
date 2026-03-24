import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { displayName, photoURL } = body as {
    displayName?: string;
    photoURL?: string;
  };

  // Validate displayName
  if (displayName !== undefined) {
    if (typeof displayName !== "string") {
      return NextResponse.json({ error: "displayName must be a string" }, { status: 400 });
    }
    if (displayName.length > 50) {
      return NextResponse.json(
        { error: "displayName must be 50 characters or less" },
        { status: 400 },
      );
    }
  }

  // Validate photoURL
  if (photoURL !== undefined) {
    if (typeof photoURL !== "string") {
      return NextResponse.json({ error: "photoURL must be a string" }, { status: 400 });
    }
    if (photoURL !== "") {
      try {
        new URL(photoURL);
      } catch {
        return NextResponse.json({ error: "photoURL must be a valid URL or empty" }, { status: 400 });
      }
    }
  }

  const data: Record<string, string | null> = {};
  if (displayName !== undefined) data.displayName = displayName.trim() || null;
  if (photoURL !== undefined) data.photoURL = photoURL.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      id: true,
      email: true,
      tier: true,
      emailVerified: true,
      displayName: true,
      photoURL: true,
      authProvider: true,
    },
  });

  return NextResponse.json({ user });
}
