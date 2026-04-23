import { type Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Breadcrumb } from "~/components/ui/Breadcrumb";
import { PricingTabs } from "./PricingTabs";

export const metadata: Metadata = {
  title: "Pricing — MELTR",
  description: "Simple, transparent pricing for Meltr — free for developers, flat fee for companies.",
};

export default async function PricingPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? "";
  const defaultTab = role === "COMPANY" ? "companies" : "developers";

  return (
    <div className="pt-12">
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />

      {/* Page header */}
      <div className="bg-background px-6 pb-8 pt-16 text-center">
        <div className="label mb-3">Simple Pricing</div>
        <h1
          className="mb-3 font-display font-bold uppercase text-text-primary"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          Pricing
        </h1>
        <p className="mx-auto max-w-sm text-base text-text-secondary" style={{ lineHeight: 1.6 }}>
          Free to compete. Flat fee to run a contest. No hidden costs.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-20">
        <PricingTabs defaultTab={defaultTab as "developers" | "companies"} />
      </div>

      {/* Footer note */}
      <div className="border-t border-border px-6 py-10 text-center">
        <p className="text-[0.8rem] text-text-muted">
          All results are cryptographically signed regardless of plan. Meltr does not manipulate scores.
        </p>
      </div>
    </div>
  );
}
