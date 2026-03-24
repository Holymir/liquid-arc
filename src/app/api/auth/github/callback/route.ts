import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

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
    const storedState = cookieStore.get("github_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_state_mismatch", appUrl())
      );
    }

    // Clear the state cookie
    cookieStore.delete("github_oauth_state");

    // Exchange authorization code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code,
          redirect_uri: `${appUrl()}/api/auth/github/callback`,
        }),
      }
    );

    if (!tokenRes.ok) {
      console.error("GitHub token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", appUrl())
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string | undefined = tokenData.access_token;

    if (!accessToken) {
      console.error("GitHub token missing from response:", tokenData);
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", appUrl())
      );
    }

    // Fetch user profile from GitHub
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!profileRes.ok) {
      console.error("GitHub profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", appUrl())
      );
    }

    const profile = await profileRes.json();
    let email: string | null = profile.email;
    const name: string | undefined = profile.name || profile.login;
    const avatarUrl: string | undefined = profile.avatar_url;

    // GitHub email may be private — fetch from /user/emails endpoint
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (emailsRes.ok) {
        const emails: GitHubEmail[] = await emailsRes.json();
        // Prefer the primary verified email
        const primary = emails.find((e) => e.primary && e.verified);
        const verified = emails.find((e) => e.verified);
        email = primary?.email || verified?.email || emails[0]?.email || null;
      }
    }

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
          photoURL: user.photoURL || avatarUrl || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // New user — create with GitHub provider
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: null,
          authProvider: "github",
          emailVerified: true,
          displayName: name || null,
          photoURL: avatarUrl || null,
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
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", appUrl())
    );
  }
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
