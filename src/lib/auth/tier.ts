// Tier definitions and enforcement helpers

export const TIER_LIMITS = {
  free: {
    maxWallets: 2,
    maxAlerts: 0,
    cacheSeconds: 300,    // 5 min portfolio cache
    exportEnabled: false,
    historyDays: 7,       // max history period (days); 0 = unlimited
    apiAccess: false,     // public LP Analytics API
  },
  pro: {
    maxWallets: 10,
    maxAlerts: 10,
    cacheSeconds: 60,     // 1 min portfolio cache
    exportEnabled: true,
    historyDays: 90,
    apiAccess: true,
  },
  enterprise: {
    maxWallets: 50,
    maxAlerts: 100,
    cacheSeconds: 15,     // 15 sec portfolio cache
    exportEnabled: true,
    historyDays: 0,       // 0 = unlimited
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
  feature: keyof Omit<typeof TIER_LIMITS.free, "maxWallets" | "maxAlerts" | "cacheSeconds" | "historyDays">
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

/**
 * Check whether a user's tier allows a given history period (in days).
 * Enterprise tier has unlimited history (historyDays === 0).
 */
export function checkHistoryAccess(
  userTier: string,
  requestedDays: number
): TierGuardResult {
  const limits = getTierLimits(userTier);
  const maxDays = limits.historyDays;

  if (maxDays === 0 || requestedDays <= maxDays) return { allowed: true };

  const requiredTier = maxDays <= TIER_LIMITS.pro.historyDays ? "pro" : "enterprise";

  return {
    allowed: false,
    error: {
      message: `Your plan allows up to ${maxDays} days of history. Upgrade to ${requiredTier} for more.`,
      code: "HISTORY_LIMIT",
      requiredTier,
    },
  };
}

/**
 * Check whether a user can create another alert.
 */
export function checkAlertLimit(
  userTier: string,
  currentAlertCount: number
): TierGuardResult {
  const limits = getTierLimits(userTier);

  if (limits.maxAlerts === 0) {
    return {
      allowed: false,
      error: {
        message: "Alerts require a Pro plan. Upgrade at /pricing.",
        code: "ALERTS_NOT_AVAILABLE",
        requiredTier: "pro",
      },
    };
  }

  if (currentAlertCount >= limits.maxAlerts) {
    const requiredTier = currentAlertCount >= TIER_LIMITS.pro.maxAlerts ? "enterprise" : "pro";
    return {
      allowed: false,
      error: {
        message: `Alert limit reached (${limits.maxAlerts}). Upgrade to ${requiredTier} for more.`,
        code: "ALERT_LIMIT",
        requiredTier,
      },
    };
  }

  return { allowed: true };
}
