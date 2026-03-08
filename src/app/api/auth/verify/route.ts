import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  try {
    const { message, signature } = await request.json();

    const siweMessage = new SiweMessage(message);
    const { data: verified } = await siweMessage.verify({
      signature,
      nonce: session.nonce,
    });

    if (!verified.address) {
      session.isLoggedIn = false;
      await session.save();
      return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }

    const address = verified.address.toLowerCase();

    // Upsert user by address
    const user = await prisma.user.upsert({
      where: { address },
      update: { updatedAt: new Date() },
      create: { address },
    });

    // Auto-link any existing wallets for this address that have no owner
    await prisma.wallet.updateMany({
      where: { address, userId: null },
      data: { userId: user.id },
    });

    // Update session
    session.userId = user.id;
    session.address = address;
    session.nonce = undefined; // consumed
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, address });
  } catch (err) {
    console.error("[auth] SIWE verify error:", err);
    session.isLoggedIn = false;
    await session.save();
    return NextResponse.json({ error: "Verification failed" }, { status: 401 });
  }
}
