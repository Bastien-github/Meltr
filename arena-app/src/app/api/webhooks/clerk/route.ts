import { type WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { env } from "~/env.js";
import { db } from "~/server/db.js";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json() as unknown;
  const body = JSON.stringify(payload);

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, public_metadata } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      await db.user.create({
        data: {
          clerkId: id,
          email,
          role: (public_metadata?.role as "COMPANY" | "DEVELOPER" | "ADMIN") ?? "DEVELOPER",
          onboardingComplete: (public_metadata?.onboardingComplete as boolean) ?? false,
        },
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, public_metadata } = event.data;
      const email = email_addresses[0]?.email_address;

      await db.user.updateMany({
        where: { clerkId: id },
        data: {
          ...(email ? { email } : {}),
          ...(public_metadata?.role ? { role: public_metadata.role as "COMPANY" | "DEVELOPER" | "ADMIN" } : {}),
          ...(public_metadata?.onboardingComplete !== undefined
            ? { onboardingComplete: public_metadata.onboardingComplete as boolean }
            : {}),
        },
      });
      break;
    }

    default:
      // Ignore all other event types
      break;
  }

  return NextResponse.json({ received: true });
}
