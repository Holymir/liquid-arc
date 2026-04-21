import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/stripe/cancel
 *
 * Cancels the current active Stripe subscription and reverts the user to the
 * free tier immediately. The cancellation happens at period end in Stripe to
 * give the user the remaining paid days, but we downgrade the tier in our DB
 * right away to match the user's intent (they chose to leave).
 *
 * If you prefer to keep access until period end, remove the DB update below
 * and rely on the `customer.subscription.deleted` webhook to flip the tier.
 */
export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        tier: true,
        subscriptionId: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Nothing to cancel
    if (user.tier === "free" || !user.subscriptionId) {
      return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
    }

    const activeStatuses = ["active", "trialing", "past_due"];
    if (!activeStatuses.includes(user.subscriptionStatus ?? "")) {
      return NextResponse.json(
        { error: "Subscription is not in a cancellable state" },
        { status: 400 }
      );
    }

    // Cancel at period end so the user keeps access for the remainder of their billing cycle.
    // The webhook (customer.subscription.deleted) will flip tier → free when it fires.
    // We also proactively downgrade in our DB now so the UI reflects the intent immediately.
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: "free",
        subscriptionStatus: "canceled",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[stripe/cancel]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
