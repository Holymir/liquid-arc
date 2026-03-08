import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  address?: string;
  nonce?: string;
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "liquidark_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getServerSession(): Promise<SessionData> {
  const cookieStore = cookies();
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
  return session as SessionData & { userId: string; address: string };
}
