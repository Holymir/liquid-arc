import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { stripe, STRIPE_PLANS, type PlanTier } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  try {
    const session = await requireAuth();
    const { tier } = await req.json();

    if (!tier || !STRIPE_PLANS[tier as PlanTier]) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    const plan = STRIPE_PLANS[tier as PlanTier];

    // Guard against missing price ID env vars
    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Price ID for plan "${tier}" is not configured. Set STRIPE_${tier.toUpperCase()}_PRICE_ID.` },
        { status: 503 }
      );
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, stripeCustomerId: true, tier: true, subscriptionId: true, subscriptionStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow downgrade via checkout
    if (user.tier === tier) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
    }

    // Cancel any existing active subscription before creating a new checkout.
    // This prevents users from accumulating multiple concurrent paid subscriptions.
    const activeStatuses = ["active", "trialing", "past_due"];
    if (
      user.subscriptionId &&
      user.subscriptionStatus &&
      activeStatuses.includes(user.subscriptionStatus)
    ) {
      try {
        await stripe.subscriptions.cancel(user.subscriptionId);
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: "free", subscriptionId: null, subscriptionStatus: "canceled" },
        });
      } catch (cancelErr) {
        // Log but don't block — Stripe may have already cancelled it
        console.error("[stripe/checkout] Failed to cancel existing subscription:", cancelErr);
      }
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId: user.id, tier },
      subscription_data: {
        metadata: { userId: user.id, tier },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
