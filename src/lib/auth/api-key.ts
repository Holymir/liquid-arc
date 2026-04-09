/**
 * LP Analytics public API — API key authentication helpers (issue #50)
 *
 * Keys are issued as: la_<32 random hex bytes>
 * Only the SHA-256 hash is stored in the DB; the raw key is shown once at creation.
 */

import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Generate a new raw API key (not stored — caller must hash + save). */
export function generateRawApiKey(): string {
  return "la_" + randomBytes(32).toString("hex");
}

/** Hash a raw key for storage/comparison. */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Extract Bearer token from Authorization header, or x-api-key header. */
function extractKey(req: NextRequest): string | null {
  const xApiKey = req.headers.get("x-api-key");
  if (xApiKey) return xApiKey.trim();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();

  return null;
}

export interface ApiKeyContext {
  userId: string;
  tier: string;
  keyId: string;
}

/**
 * Validate the API key from the request.
 * Updates last_used_at on success.
 * Returns null if the key is missing, invalid, or inactive.
 */
export async function validateApiKey(req: NextRequest): Promise<ApiKeyContext | null> {
  const raw = extractKey(req);
  if (!raw) return null;

  // Keys must start with "la_"
  if (!raw.startsWith("la_")) return null;

  const hash = hashApiKey(raw);

  const row = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: { select: { id: true, tier: true } } },
  });

  if (!row || !row.isActive) return null;

  // Fire-and-forget last_used_at update (don't await — keep latency low)
  prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch((err: unknown) => console.error("[api-key] lastUsedAt update failed:", err));

  return {
    userId: row.user.id,
    tier: row.user.tier,
    keyId: row.id,
  };
}
