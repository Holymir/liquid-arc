import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "Password reset successfully" });
}
