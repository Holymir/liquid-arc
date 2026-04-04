import Stripe from "stripe";

// Gracefully handle missing STRIPE_SECRET_KEY — the app should still boot
// in environments where Stripe isn't configured (CI, dev without billing, etc.).
// All Stripe routes guard against a null client before use.
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    })
  : null;

export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 1500, // $15.00
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    amount: 9900, // $99.00
  },
} as const;

export type PlanTier = keyof typeof STRIPE_PLANS;
