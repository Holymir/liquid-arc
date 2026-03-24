import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error || !code || !state) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_denied", appUrl())
      );
    }

    // Verify state matches cookie (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_state_mismatch", appUrl())
      );
    }

    // Clear the state cookie
    cookieStore.delete("google_oauth_state");

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl()}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", appUrl())
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // Fetch user profile from Google
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!profileRes.ok) {
      console.error("Google profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", appUrl())
      );
    }

    const profile = await profileRes.json();
    const email: string | undefined = profile.email;
    const name: string | undefined = profile.name;
    const picture: string | undefined = profile.picture;

    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_no_email", appUrl())
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing user — update last login fields
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: user.displayName || name || null,
          photoURL: user.photoURL || picture || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // New user — create with Google provider
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: null,
          authProvider: "google",
          emailVerified: true,
          displayName: name || null,
          photoURL: picture || null,
        },
      });
    }

    // Set iron-session
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.tier = user.tier;
    session.emailVerified = user.emailVerified;
    session.displayName = user.displayName || undefined;
    session.photoURL = user.photoURL || undefined;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(new URL("/dashboard", appUrl()));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", appUrl())
    );
  }
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
