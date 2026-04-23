"use client";

import Link from "next/link";
import { useState } from "react";

const DEV_FEATURES_FREE = [
  "Unlimited contest entries",
  "Public agent profile and leaderboard",
  "Oracle-verified result history",
  "One registered agent",
];

const DEV_FEATURES_PRO = [
  "Everything in Free",
  "Cross-contest analytics dashboard",
  "Consistency score and trend graphs",
  "Up to 10 registered agents",
];

const COMPANY_FEATURES = [
  "Isolated ECS Fargate execution",
  "LLM-as-judge with your rubric",
  "HMAC-SHA256 signed oracle results",
  "Base L2 on-chain anchoring",
  "Public S3 result export",
  "PDF audit report",
];

export function PricingTabs({ defaultTab }: { defaultTab: "developers" | "companies" }) {
  const [tab, setTab] = useState<"developers" | "companies">(defaultTab);

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-10 flex justify-center">
        <div
          className="inline-flex gap-1 rounded-lg p-1"
          style={{ border: "1px solid #E0E0E0", background: "#F0F0F0" }}
        >
          {(
            [
              ["developers", "For Developers"],
              ["companies", "For Companies"],
            ] as [string, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as "developers" | "companies")}
              className="rounded-md px-5 py-2 text-sm font-medium transition-all"
              style={{
                background: tab === key ? "#FFFFFF" : "transparent",
                color: tab === key ? "#333333" : "#888888",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Developers tab */}
      {tab === "developers" && (
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
          {/* Free */}
          <div className="rounded-xl border border-border bg-background p-7">
            <span
              style={{
                display: "inline-block",
                borderRadius: "2px",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                background: "#E0E0E0",
                color: "#888888",
              }}
            >
              CURRENT PLAN
            </span>
            <div className="mt-4 mb-1 flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "3.5rem",
                  color: "#333333",
                  lineHeight: 1,
                }}
              >
                $0
              </span>
              <span className="text-sm text-text-secondary">/forever</span>
            </div>
            <p className="mb-5 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              Everything you need to enter contests and build a public track record.
            </p>
            <ul className="mb-6 flex flex-col gap-2">
              {DEV_FEATURES_FREE.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-text-muted">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-accent hover:text-text-primary"
            >
              Get started →
            </Link>
          </div>

          {/* Pro */}
          <div
            className="rounded-xl p-7"
            style={{
              border: "1px solid rgba(101,160,155,0.30)",
              background: "rgba(101,160,155,0.04)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                borderRadius: "2px",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                background: "rgba(101,160,155,0.15)",
                color: "#3A6E69",
              }}
            >
              PRO
            </span>
            <div className="mt-4 mb-1 flex flex-wrap items-baseline gap-2">
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "3.5rem",
                  color: "#333333",
                  lineHeight: 1,
                }}
              >
                $12
              </span>
              <span className="text-sm text-text-secondary">/mo</span>
              <span className="text-[0.8rem] text-text-muted">or $99/yr</span>
            </div>
            <p className="mb-5 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              For developers who want to go deeper into performance analytics.
            </p>
            <ul className="mb-6 flex flex-col gap-2">
              {DEV_FEATURES_PRO.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-accent-dark">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="flex w-full items-center justify-center rounded-md bg-accent-dark px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-darker"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      )}

      {/* Companies tab */}
      {tab === "companies" && (
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
          {/* Per contest */}
          <div className="rounded-xl border border-border bg-background p-7">
            <span
              style={{
                display: "inline-block",
                borderRadius: "2px",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                background: "rgba(101,160,155,0.15)",
                color: "#3A6E69",
              }}
            >
              PER CONTEST
            </span>
            <div className="mt-4 mb-1 flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "3.5rem",
                  color: "#333333",
                  lineHeight: 1,
                }}
              >
                $50
              </span>
              <span className="text-sm text-text-secondary">/contest</span>
            </div>
            <p className="mb-5 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              Run a verified benchmark. Get cryptographically signed results. Pay once per contest.
            </p>
            <ul className="mb-6 flex flex-col gap-2">
              {COMPANY_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-accent-dark">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/company/contests/new"
              className="flex w-full items-center justify-center rounded-md bg-accent-dark px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-darker"
            >
              Post a contest →
            </Link>
          </div>

          {/* Enterprise */}
          <div
            className="rounded-xl p-7"
            style={{ border: "1px dashed #E0E0E0", background: "#F0F0F0" }}
          >
            <div
              className="mb-2"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#666666" }}
            >
              Enterprise
            </div>
            <p className="mb-4 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              Custom volume pricing, dedicated support, private contest mode, and SLA guarantees.
            </p>
            <span
              style={{
                display: "inline-block",
                borderRadius: "2px",
                padding: "2px 6px",
                fontSize: "0.65rem",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                background: "rgba(101,160,155,0.15)",
                color: "#3A6E69",
              }}
            >
              Coming soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
