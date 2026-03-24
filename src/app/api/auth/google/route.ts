import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_not_configured", appUrl())
      );
    }

    const state = crypto.randomUUID();

    // Store state in a short-lived cookie for CSRF verification
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    });

    const redirectUri = `${appUrl()}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent",
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.redirect(googleAuthUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", appUrl())
    );
  }
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
