import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { generateNonce } from "siwe";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  session.nonce = generateNonce();
  await session.save();

  return NextResponse.json({ nonce: session.nonce });
}
