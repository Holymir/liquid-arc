import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * Validate SESSION_SECRET at module load time. iron-session requires a
 * 32+ character secret; a missing or placeholder value lets attackers forge
 * cookies (CODE_REVIEW.md §1.2). We throw eagerly so misconfigured deploys
 * fail loudly instead of silently accepting forged sessions.
 *
 * Skipped during `npm run build` so prerendering doesn't require the secret.
 */
export function validateSessionSecret(
  secret: string | undefined,
  phase: string | undefined = process.env.NEXT_PHASE
): string {
  if (phase === "phase-production-build") {
    return secret ?? "build-time-placeholder-do-not-deploy-with-this-value";
  }
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32`."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long."
    );
  }
  if (secret.toLowerCase().startsWith("placeholder")) {
    throw new Error(
      "SESSION_SECRET is a placeholder. Generate a real secret with `openssl rand -base64 32`."
    );
  }
  return secret;
}

const sessionSecret = validateSessionSecret(process.env.SESSION_SECRET);

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "liquidark_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getServerSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    Object.assign(session, defaultSession);
  }

  return session;
}

/** Returns session or throws. Use in route handlers that require auth. */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session.isLoggedIn || !session.userId) {
    throw new Error("Unauthorized");
  }
  return session as SessionData & { userId: string };
}
