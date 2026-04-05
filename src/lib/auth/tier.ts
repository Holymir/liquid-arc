// Tier definitions and enforcement helpers

export const TIER_LIMITS = {
  free: {
    maxWallets: 2,
    maxAlerts: 0,
    cacheSeconds: 300,    // 5 min portfolio cache
    exportEnabled: false,
    apiAccess: false,     // LP Analytics public API
  },
  pro: {
    maxWallets: 10,
    maxAlerts: 10,
    cacheSeconds: 60,     // 1 min portfolio cache
    exportEnabled: true,
    apiAccess: true,
  },
  enterprise: {
    maxWallets: 50,
    maxAlerts: 100,
    cacheSeconds: 15,     // 15 sec portfolio cache
    exportEnabled: true,
    apiAccess: true,
  },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}

// ── Enforcement helpers ───────────────────────────────────────────────────────

export interface TierGuardResult {
  allowed: boolean;
  error?: { message: string; code: string; requiredTier: Tier };
}

/**
 * Check whether a user's tier allows a named feature.
 */
export function checkFeatureAccess(
  userTier: string,
  feature: keyof Omit<typeof TIER_LIMITS.free, "maxWallets" | "maxAlerts" | "cacheSeconds">
): TierGuardResult {
  const limits = getTierLimits(userTier);
  const allowed = Boolean(limits[feature]);
  if (allowed) return { allowed: true };

  const requiredTier = (["pro", "enterprise"] as Tier[]).find(
    (t) => Boolean(TIER_LIMITS[t][feature])
  ) ?? "pro";

  return {
    allowed: false,
    error: {
      message: `This feature requires a ${requiredTier} plan. Upgrade at /pricing.`,
      code: "TIER_REQUIRED",
      requiredTier,
    },
  };
}
