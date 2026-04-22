import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "~/env.js";
import { db } from "~/server/db.js";
import { ContestStateMachine } from "~/server/services/contest/state-machine.js";
import { ContestStatus } from "~/server/db.js";

export async function POST(req: Request) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[StripeWebhook] Signature verification failed: ${msg}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[StripeWebhook] event=${event.type} id=${event.id}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(sub);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(sub);
      break;
    }
    default:
      console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const mode = session.mode;

  if (mode === "payment") {
    // Contest publish flow: metadata.contestId
    const contestId = session.metadata?.contestId;
    if (!contestId) {
      console.error("[StripeWebhook] checkout.session.completed payment mode missing contestId");
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      console.error("[StripeWebhook] no payment_intent in session");
      return;
    }

    // Store the payment intent and transition to OPEN
    await db.contest.update({
      where: { id: contestId },
      data: { stripePaymentIntentId: paymentIntentId },
    });

    await ContestStateMachine.transition(
      contestId,
      ContestStatus.OPEN,
      "stripe:checkout-completed",
    );

    console.log(`[StripeWebhook] contestId=${contestId} transitioned to OPEN`);
  } else if (mode === "subscription") {
    // Developer Pro subscription
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!customerId || !subscriptionId) return;

    await db.developer.updateMany({
      where: { stripeCustomerId: customerId },
      data: { subscriptionTier: "pro", stripeSubscriptionId: subscriptionId },
    });

    console.log(`[StripeWebhook] developer subscribed customerId=${customerId}`);
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await db.developer.updateMany({
    where: { stripeCustomerId: customerId },
    data: { subscriptionTier: "free", stripeSubscriptionId: null },
  });

  console.log(`[StripeWebhook] subscription cancelled customerId=${customerId}`);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const isActive = sub.status === "active" || sub.status === "trialing";

  await db.developer.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: isActive ? "pro" : "free",
      stripeSubscriptionId: isActive ? sub.id : null,
    },
  });

  console.log(`[StripeWebhook] subscription updated customerId=${customerId} status=${sub.status}`);
}
