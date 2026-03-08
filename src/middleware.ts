import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname === "/"
  ) {
    return res;
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/wallets/:path*",
    "/api/portfolio/:path*",
    "/api/prices/:path*",
  ],
};
