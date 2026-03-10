import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ message: "Email already verified" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });

  return NextResponse.json({ message: "Email verified successfully" });
}
