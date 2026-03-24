import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_not_configured", appUrl())
      );
    }

    const state = crypto.randomUUID();

    // Store state in a short-lived cookie for CSRF verification
    const cookieStore = await cookies();
    cookieStore.set("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutes
      path: "/",
    });

    const redirectUri = `${appUrl()}/api/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "user:email",
      state,
    });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(githubAuthUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", appUrl())
    );
  }
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
