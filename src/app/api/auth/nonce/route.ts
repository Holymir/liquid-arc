import { NextResponse } from "next/server";

// SIWE nonce endpoint — deprecated. Use /api/auth/login or /api/auth/register.
export async function GET() {
  return NextResponse.json({ error: "SIWE auth has been removed. Use email login." }, { status: 410 });
}
