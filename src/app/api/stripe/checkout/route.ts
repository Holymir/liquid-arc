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
      select: { id: true, email: true, stripeCustomerId: true, tier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow downgrade via checkout
    if (user.tier === tier) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
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
