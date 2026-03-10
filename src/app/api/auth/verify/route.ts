import { NextResponse } from "next/server";

// SIWE verify endpoint — deprecated. Use /api/auth/login or /api/auth/register.
export async function POST() {
  return NextResponse.json({ error: "SIWE auth has been removed. Use email login." }, { status: 410 });
}
