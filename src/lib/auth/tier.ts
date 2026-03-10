// Tier definitions and enforcement helpers

export const TIER_LIMITS = {
  free: {
    maxWallets: 2,
    maxAlerts: 0,
    cacheSeconds: 300,    // 5 min portfolio cache
    exportEnabled: false,
  },
  pro: {
    maxWallets: 10,
    maxAlerts: 10,
    cacheSeconds: 60,     // 1 min portfolio cache
    exportEnabled: true,
  },
  enterprise: {
    maxWallets: 50,
    maxAlerts: 100,
    cacheSeconds: 15,     // 15 sec portfolio cache
    exportEnabled: true,
  },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}
